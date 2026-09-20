import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

import { rejectConsumedAppCheckToken } from './appCheck.ts';

function request(app?: CallableRequest['app']): CallableRequest<unknown> {
  return { data: {}, app, rawRequest: {} as never, acceptsStreaming: false };
}

const appCheck = (alreadyConsumed?: boolean): CallableRequest['app'] => ({
  appId: '1:123:web:abc',
  token: {} as never,
  alreadyConsumed,
});

describe('rejectConsumedAppCheckToken', () => {
  it('lets a fresh token (or no App Check data at all) through', () => {
    expect(() => rejectConsumedAppCheckToken(request(appCheck(false)))).not.toThrow();
    expect(() => rejectConsumedAppCheckToken(request(appCheck()))).not.toThrow();
    expect(() => rejectConsumedAppCheckToken(request())).not.toThrow();
  });

  it('throws permission-denied for a token the App Check service has already consumed', () => {
    let thrown: unknown;
    try {
      rejectConsumedAppCheckToken(request(appCheck(true)));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(HttpsError);
    expect((thrown as HttpsError).code).toBe('permission-denied');
  });
});
