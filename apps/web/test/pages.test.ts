import { createRequestEvent } from '@solidjs/web';
import { provideRequestEvent } from '@solidjs/web/storage';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { setupTestDatabase } from './db.ts';

const baseURL = 'http://localhost:3000';

type AuthInstance = typeof import('../src/server/auth/auth.ts').auth;
type HomeDataModule = typeof import('../src/server/auth/home-data.ts');

let auth: AuthInstance;
let getHomeData: HomeDataModule['getHomeData'];

beforeAll(async () => {
  vi.stubEnv('SURREAL_ENDPOINT', 'mem://');
  vi.stubEnv('BETTER_AUTH_URL', baseURL);
  await setupTestDatabase();
  vi.stubEnv('BETTER_AUTH_SECRET', 'page-test-secret-not-for-production');
  ({ auth } = await import('../src/server/auth/auth.ts'));
  ({ getHomeData } = await import('../src/server/auth/home-data.ts'));
}, 30_000);

afterAll(async () => {
  const { closeDb } = await import('../src/server/db/index.ts');
  await closeDb();
  vi.unstubAllEnvs();
});

interface TestSession {
  cookie: string;
  userId: string;
}

async function register(email: string): Promise<TestSession> {
  const response = await auth.handler(
    new Request(`${baseURL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseURL },
      body: JSON.stringify({
        name: 'Page Tester',
        email,
        password: 'correct horse battery staple',
      }),
    })
  );
  expect(response.ok).toBe(true);
  const body = (await response.json()) as { user: { id: string } };
  const pairs = response.headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(';')[0] ?? '');
  expect(pairs.length).toBeGreaterThan(0);
  return { cookie: pairs.join('; '), userId: body.user.id };
}

function inRequest<T>(run: () => Promise<T>, cookie?: string): Promise<T> {
  const headers = new Headers(cookie ? { cookie } : undefined);
  return provideRequestEvent(
    createRequestEvent(new Request(baseURL, { headers })),
    run
  );
}

async function rejection(run: () => Promise<unknown>): Promise<unknown> {
  return run().catch((reason: unknown) => reason);
}

function expectLoginRedirect(reason: unknown): void {
  expect(reason).toBeInstanceOf(Response);
  if (!(reason instanceof Response)) throw new Error('unreachable');
  expect(reason.status).toBe(302);
  expect(reason.headers.get('location')).toBe('/login');
}

describe('getHomeData', () => {
  it('redirects unauthenticated requests to /login', async () => {
    expectLoginRedirect(await inRequest(() => rejection(getHomeData)));
  });

  it('returns the session user from both requireUser and getMe', async () => {
    const { cookie, userId } = await register('home@page.test');
    const data = await inRequest(getHomeData, cookie);
    expect(data.guard.id).toBe(userId);
    expect(data.me.id).toBe(userId);
    expect(data.guard.email).toBe('home@page.test');
    expect(data.me.email).toBe('home@page.test');
  });
});
