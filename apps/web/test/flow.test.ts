import { setupTestDatabase } from './db.ts';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const baseURL = 'http://localhost:3000';

type AuthInstance = typeof import('../src/server/auth/auth.ts').auth;

let auth: AuthInstance;

beforeAll(async () => {
  vi.stubEnv('SURREAL_ENDPOINT', 'mem://');
  vi.stubEnv('BETTER_AUTH_URL', baseURL);
  await setupTestDatabase();
  vi.stubEnv('BETTER_AUTH_SECRET', 'flow-test-secret-not-for-production');
  ({ auth } = await import('../src/server/auth/auth.ts'));
}, 30_000);

afterAll(async () => {
  const { closeDb } = await import('../src/server/db/index.ts');
  await closeDb();
  vi.unstubAllEnvs();
});

function cookieHeader(setCookies: string[]): string {
  return setCookies
    .map((setCookie) => setCookie.split(';')[0] ?? '')
    .join('; ');
}

describe('email/password flow', () => {
  it('signs in an existing user and signs them out', async () => {
    const email = 'flow@auth.test';
    const password = 'correct horse battery staple';

    const registerResponse = await auth.handler(
      new Request(`${baseURL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: baseURL },
        body: JSON.stringify({ name: 'Flow Tester', email, password }),
      })
    );
    expect(registerResponse.ok).toBe(true);

    const signInResponse = await auth.handler(
      new Request(`${baseURL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: baseURL },
        body: JSON.stringify({ email, password }),
      })
    );
    expect(signInResponse.ok).toBe(true);
    const cookies = signInResponse.headers.getSetCookie();
    expect(cookies.length).toBeGreaterThan(0);

    const signOutResponse = await auth.handler(
      new Request(`${baseURL}/api/auth/sign-out`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: baseURL,
          cookie: cookieHeader(cookies),
        },
      })
    );
    expect(signOutResponse.ok).toBe(true);
  });
});
