import type { Surreal } from 'surrealdb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { TestApp } from './helpers';
import {
  createTestApp,
  createTestDatabase,
  setupTestDatabase,
  testBaseUrl,
} from './helpers';

const frontendOrigin = 'http://localhost:5173';
const password = 'correct horse battery staple';

let db: Surreal;
let app: TestApp;

beforeAll(async () => {
  db = await createTestDatabase();
  await setupTestDatabase(db);
  app = createTestApp(db);
}, 30_000);

afterAll(async () => {
  await app.dispose();
  await db.close();
});

const jsonHeaders = {
  'content-type': 'application/json',
  origin: frontendOrigin,
};

const cookieHeader = (response: Response): string =>
  response.headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(';')[0] ?? '')
    .join('; ');

describe('email/password flow over the HTTP API', () => {
  it('registers, signs in, and signs out', async () => {
    const email = 'flow@api.test';

    const register = await app.handler(
      new Request(`${testBaseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ name: 'Flow Tester', email, password }),
      })
    );
    expect(register.ok).toBe(true);

    const signIn = await app.handler(
      new Request(`${testBaseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ email, password }),
      })
    );
    expect(signIn.ok).toBe(true);
    const cookie = cookieHeader(signIn);
    expect(cookie.length).toBeGreaterThan(0);

    const signOut = await app.handler(
      new Request(`${testBaseUrl}/api/auth/sign-out`, {
        method: 'POST',
        headers: { ...jsonHeaders, cookie },
      })
    );
    expect(signOut.ok).toBe(true);
  });
});
