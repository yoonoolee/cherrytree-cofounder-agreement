import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import { fakeCollection } from '../test/helpers/fakeFirestore.ts';

const { post, projects } = vi.hoisted(() => ({
  post: vi.fn(),
  projects: { current: null as unknown },
}));

vi.mock('axios', () => ({ default: { post } }));
vi.mock('firebase-functions', () => ({ logger: { error: vi.fn(), info: vi.fn() } }));
vi.mock('./lib/firebase.ts', () => ({
  get projects() {
    return projects.current;
  },
}));

const { buildPdfPayload, generatePreviewPDF, submitSurvey } = await import('./pdf.ts');

const ADMIN = 'user_admin';
const MEMBER = 'user_member';
const OUTSIDER = 'user_outsider';
const TRUSTED_URL = 'https://drive.google.com/file/d/abc/view';

function timestamp(iso: string) {
  const date = new Date(iso);
  return { toDate: () => date, toMillis: () => date.getTime() };
}

function project(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Acme & Co <Ltd>',
    admin: ADMIN,
    collaborators: {
      [ADMIN]: { role: 'admin', isActive: true, history: [{ startAt: new Date(0), endAt: null }] },
      [MEMBER]: {
        role: 'collaborator',
        isActive: true,
        history: [{ startAt: new Date(0), endAt: null }],
      },
      [OUTSIDER]: {
        role: 'collaborator',
        isActive: false,
        history: [{ startAt: new Date(0), endAt: new Date(1) }],
      },
    },
    surveyData: { companyName: 'Acme', entityType: 'Other', entityTypeOther: 'Cooperative' },
    lastUpdated: timestamp('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function call(uid: string | undefined, data: unknown): CallableRequest<never> {
  return {
    data: data as never,
    auth: uid ? { uid, token: {} as never, rawToken: 'id-token' } : undefined,
    rawRequest: {} as never,
    acceptsStreaming: false,
  };
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
  process.env.MAKE_WEBHOOK_URL = 'https://hook.make.test/abc';
  projects.current = fakeCollection({ proj_1: project() });
  post.mockResolvedValue({ data: { pdfUrl: TRUSTED_URL } });
});

describe('buildPdfPayload', () => {
  it('HTML-escapes the project name and merges "Other" fields, leaving the project untouched', () => {
    const data = project();
    const payload = buildPdfPayload('proj_1', data as never, {
      submittedAt: new Date('2026-02-03T04:05:06Z'),
    });

    expect(payload).toEqual({
      projectId: 'proj_1',
      projectName: 'Acme &amp; Co &lt;Ltd&gt;',
      submittedAt: '2026-02-03T04:05:06.000Z',
      data: { companyName: 'Acme', entityType: 'Cooperative' },
    });
    expect(data.name).toBe('Acme & Co <Ltd>');
  });

  it('flags previews and omits submittedAt', () => {
    expect(buildPdfPayload('proj_1', project() as never, { isPreview: true })).toMatchObject({
      isPreview: true,
    });
    expect(buildPdfPayload('proj_1', project() as never, { isPreview: true })).not.toHaveProperty(
      'submittedAt',
    );
  });
});

describe('submitSurvey', () => {
  it('rejects unauthenticated callers before touching anything', async () => {
    expect(await codeOf(submitSurvey.run(call(undefined, { projectId: 'proj_1' })))).toBe(
      'unauthenticated',
    );
    expect(post).not.toHaveBeenCalled();
  });

  it('requires a project id', async () => {
    expect(await codeOf(submitSurvey.run(call(ADMIN, {})))).toBe('invalid-argument');
    expect(await codeOf(submitSurvey.run(call(ADMIN, { projectId: 42 })))).toBe('invalid-argument');
  });

  it('returns not-found for an unknown project', async () => {
    expect(await codeOf(submitSurvey.run(call(ADMIN, { projectId: 'missing' })))).toBe('not-found');
  });

  it('only the admin (from request.auth, not the body) can submit', async () => {
    expect(await codeOf(submitSurvey.run(call(MEMBER, { projectId: 'proj_1' })))).toBe(
      'permission-denied',
    );
    expect(
      await codeOf(submitSurvey.run(call(MEMBER, { projectId: 'proj_1', userId: ADMIN }))),
    ).toBe('permission-denied');
    expect(post).not.toHaveBeenCalled();
  });

  it('posts the escaped payload to Make.com and records the trusted PDF URL', async () => {
    const result = await submitSurvey.run(call(ADMIN, { projectId: 'proj_1' }));

    expect(post).toHaveBeenCalledTimes(1);
    const [url, payload, options] = post.mock.calls[0]!;
    expect(url).toBe('https://hook.make.test/abc');
    expect(payload).toMatchObject({
      projectId: 'proj_1',
      projectName: 'Acme &amp; Co &lt;Ltd&gt;',
      data: { entityType: 'Cooperative' },
    });
    expect(payload.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(options).toEqual({ timeout: 30_000 });

    const update = (projects.current as ReturnType<typeof fakeCollection>).doc('proj_1').update;
    expect(update).toHaveBeenCalledWith({
      pdfAgreements: FieldValue.arrayUnion({
        url: TRUSTED_URL,
        generatedAt: expect.any(Date),
        generatedBy: ADMIN,
      }),
      latestPdfUrl: TRUSTED_URL,
    });
    expect(result).toEqual({
      success: true,
      message: 'Survey submitted successfully',
      pdfUrl: TRUSTED_URL,
    });
  });

  it('refuses to store a PDF URL from an untrusted host', async () => {
    post.mockResolvedValue({ data: { pdfUrl: 'https://evil.example/agreement.pdf' } });

    expect(await codeOf(submitSurvey.run(call(ADMIN, { projectId: 'proj_1' })))).toBe('internal');
    const update = (projects.current as ReturnType<typeof fakeCollection>).doc('proj_1').update;
    expect(update).not.toHaveBeenCalled();
  });

  it('succeeds without a URL when Make.com returns none', async () => {
    post.mockResolvedValue({ data: {} });
    await expect(submitSurvey.run(call(ADMIN, { projectId: 'proj_1' }))).resolves.toMatchObject({
      success: true,
      pdfUrl: null,
    });
  });

  it('hides transport failures behind an internal error', async () => {
    post.mockRejectedValue(new Error('ECONNRESET hook.make.test'));
    const error = await submitSurvey.run(call(ADMIN, { projectId: 'proj_1' })).catch((e) => e);
    expect(error).toBeInstanceOf(HttpsError);
    expect(error.code).toBe('internal');
    expect(error.message).not.toContain('ECONNRESET');
  });
});

describe('generatePreviewPDF', () => {
  it('rejects unauthenticated callers and non-active collaborators', async () => {
    expect(await codeOf(generatePreviewPDF.run(call(undefined, { projectId: 'proj_1' })))).toBe(
      'unauthenticated',
    );
    expect(await codeOf(generatePreviewPDF.run(call(OUTSIDER, { projectId: 'proj_1' })))).toBe(
      'permission-denied',
    );
    expect(await codeOf(generatePreviewPDF.run(call('user_nobody', { projectId: 'proj_1' })))).toBe(
      'permission-denied',
    );
    expect(post).not.toHaveBeenCalled();
  });

  it('lets any active collaborator generate a preview and stores the URL', async () => {
    const result = await generatePreviewPDF.run(call(MEMBER, { projectId: 'proj_1' }));

    expect(post.mock.calls[0]![1]).toMatchObject({
      projectId: 'proj_1',
      projectName: 'Acme &amp; Co &lt;Ltd&gt;',
      isPreview: true,
    });
    const update = (projects.current as ReturnType<typeof fakeCollection>).doc('proj_1').update;
    expect(update).toHaveBeenCalledWith({
      previewPdfUrl: TRUSTED_URL,
      previewPdfGeneratedAt: FieldValue.serverTimestamp(),
    });
    expect(result).toEqual({ success: true, pdfUrl: TRUSTED_URL });
  });

  it('returns the cached preview when it is newer than the last edit', async () => {
    projects.current = fakeCollection({
      proj_1: project({
        previewPdfUrl: 'https://drive.google.com/file/d/cached/view',
        previewPdfGeneratedAt: timestamp('2026-01-02T00:00:00Z'),
        lastUpdated: timestamp('2026-01-01T00:00:00Z'),
      }),
    });

    await expect(generatePreviewPDF.run(call(ADMIN, { projectId: 'proj_1' }))).resolves.toEqual({
      success: true,
      pdfUrl: 'https://drive.google.com/file/d/cached/view',
    });
    expect(post).not.toHaveBeenCalled();
  });

  it('regenerates when the project changed after the cached preview', async () => {
    projects.current = fakeCollection({
      proj_1: project({
        previewPdfUrl: 'https://drive.google.com/file/d/cached/view',
        previewPdfGeneratedAt: timestamp('2026-01-01T00:00:00Z'),
        lastUpdated: timestamp('2026-01-02T00:00:00Z'),
      }),
    });

    await expect(generatePreviewPDF.run(call(ADMIN, { projectId: 'proj_1' }))).resolves.toEqual({
      success: true,
      pdfUrl: TRUSTED_URL,
    });
    expect(post).toHaveBeenCalledTimes(1);
  });
});
