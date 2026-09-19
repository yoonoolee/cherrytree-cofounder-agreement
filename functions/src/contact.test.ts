import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

const send = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), info: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class ResendMock {
    emails = { send };
  },
}));
vi.mock('firebase-functions', () => ({ logger }));

const { sendContactMessage } = await import('./contact.ts');

const valid = { name: '  Ada Lovelace ', email: 'ada@example.com', message: ' Hello there. ' };

function call(data: unknown): CallableRequest<never> {
  return { data: data as never, rawRequest: {} as never, acceptsStreaming: false };
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof HttpsError ? error.code : `not an HttpsError: ${String(error)}`;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = 're_x';
  send.mockResolvedValue({ data: { id: 'email_1' }, error: null });
});

describe('sendContactMessage', () => {
  it('validates name, email and message', async () => {
    expect(await codeOf(sendContactMessage.run(call({ ...valid, name: '   ' })))).toBe(
      'invalid-argument',
    );
    expect(await codeOf(sendContactMessage.run(call({ ...valid, name: 'x'.repeat(201) })))).toBe(
      'invalid-argument',
    );
    expect(await codeOf(sendContactMessage.run(call({ ...valid, email: 'nope' })))).toBe(
      'invalid-argument',
    );
    expect(await codeOf(sendContactMessage.run(call({ ...valid, message: '' })))).toBe(
      'invalid-argument',
    );
    expect(
      await codeOf(sendContactMessage.run(call({ ...valid, message: 'x'.repeat(5001) }))),
    ).toBe('invalid-argument');
    expect(await codeOf(sendContactMessage.run(call(undefined)))).toBe('invalid-argument');
    expect(send).not.toHaveBeenCalled();
  });

  it('emails the team with the trimmed fields and the submitter as reply-to', async () => {
    await expect(sendContactMessage.run(call(valid))).resolves.toEqual({ success: true });

    expect(send).toHaveBeenCalledWith({
      from: 'Cherrytree Contact Form <hello@cherrytree.app>',
      to: 'hello@cherrytree.app',
      replyTo: 'ada@example.com',
      subject: 'New contact form message from Ada Lovelace',
      text: 'From: Ada Lovelace <ada@example.com>\n\nHello there.',
    });
  });

  it('logs the Resend id but never the submitter email', async () => {
    await sendContactMessage.run(call(valid));

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('ada@example.com');
    expect(logger.info).toHaveBeenCalledWith('Contact message sent successfully', {
      resendId: 'email_1',
    });
  });

  it('maps a Resend error response and a thrown error to internal', async () => {
    send.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'bad' } });
    expect(await codeOf(sendContactMessage.run(call(valid)))).toBe('internal');

    send.mockRejectedValue(new Error('network'));
    expect(await codeOf(sendContactMessage.run(call(valid)))).toBe('internal');
  });
});
