async function loadEnv() {
  vi.resetModules();
  return (await import('./env.ts')).env;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('env', () => {
  it('groups the Firebase keys into the SDK config shape', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'api-key');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'app.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'project');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'project.firebasestorage.app');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123:web:abc');
    vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-ABC');

    expect((await loadEnv()).firebase).toEqual({
      apiKey: 'api-key',
      authDomain: 'app.firebaseapp.com',
      projectId: 'project',
      storageBucket: 'project.firebasestorage.app',
      messagingSenderId: '123',
      appId: '1:123:web:abc',
      measurementId: 'G-ABC',
    });
  });

  it('parses boolean flags: only the literal "true" is on', async () => {
    vi.stubEnv('VITE_USE_EMULATORS', 'true');
    vi.stubEnv('VITE_ENFORCE_HTTPS', 'TRUE');
    let env = await loadEnv();
    expect(env.useEmulators).toBe(true);
    expect(env.enforceHttps).toBe(false);

    vi.stubEnv('VITE_USE_EMULATORS', 'false');
    vi.stubEnv('VITE_ENFORCE_HTTPS', '');
    env = await loadEnv();
    expect(env.useEmulators).toBe(false);
    expect(env.enforceHttps).toBe(false);
  });

  it('leaves a missing key undefined rather than throwing', async () => {
    const env = await loadEnv();
    expect(env.sentryDsn).toBeUndefined();
    expect(env.clerkPublishableKey).toBeUndefined();
    expect(env.useEmulators).toBe(false);
  });

  it('exposes the Vite mode flags', async () => {
    const env = await loadEnv();
    expect(env.isDev).toBe(import.meta.env.DEV);
    expect(env.isProd).toBe(import.meta.env.PROD);
  });
});
