import { setupTestDatabase } from './db.ts';
import { createRequestEvent } from '@solidjs/web';
import { provideRequestEvent } from '@solidjs/web/storage';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const baseURL = 'http://localhost:3000';

type AuthInstance = typeof import('../src/server/auth/auth.ts').auth;
type SessionGuards = typeof import('../src/server/auth/session.ts');

let auth: AuthInstance;
let getSession: SessionGuards['getSession'];
let requireUser: SessionGuards['requireUser'];
let withAuth: SessionGuards['withAuth'];
let getMe: typeof import('../src/server/auth/get-me.ts').getMe;

beforeAll(async () => {
  // The auth singleton connects the embedded database while its module
  // initializes, so the test environment must be in place before it — or
  // anything importing it — loads.
  vi.stubEnv('SURREAL_ENDPOINT', 'mem://');
  vi.stubEnv('BETTER_AUTH_URL', baseURL);
  await setupTestDatabase();
  vi.stubEnv('BETTER_AUTH_SECRET', 'session-test-secret-not-for-production');
  ({ auth } = await import('../src/server/auth/auth.ts'));
  ({ getSession, requireUser, withAuth } = await import('../src/server/auth/session.ts'));
  ({ getMe } = await import('../src/server/auth/get-me.ts'));
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

/** Registers through Better Auth's browser protocol and captures its cookies. */
async function register(email: string): Promise<TestSession> {
  const response = await auth.handler(
    new Request(`${baseURL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: baseURL },
      body: JSON.stringify({
        name: 'Session Tester',
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

/** Runs `run` on the server half of a request carrying `cookie`. */
function inRequest<T>(run: () => Promise<T>, cookie?: string): Promise<T> {
  const headers = new Headers(cookie ? { cookie } : undefined);
  return provideRequestEvent(
    createRequestEvent(new Request(baseURL, { headers })),
    run
  );
}

/** Captures the rejection a guard throws for an unauthenticated request. */
async function rejection(run: () => Promise<unknown>): Promise<unknown> {
  return run().catch((reason: unknown) => reason);
}

function expectLoginRedirect(reason: unknown): void {
  expect(reason).toBeInstanceOf(Response);
  if (!(reason instanceof Response)) throw new Error('unreachable');
  expect(reason.status).toBe(302);
  expect(reason.headers.get('location')).toBe('/login');
}

describe('getSession', () => {
  it('resolves the user and session from the request cookie', async () => {
    const { cookie, userId } = await register('valid@session.test');
    const session = await inRequest(getSession, cookie);
    expect(session?.user.id).toBe(userId);
    expect(session?.user.email).toBe('valid@session.test');
    expect(session?.session.token).toEqual(expect.any(String));
    expect(session?.session.expiresAt).toBeInstanceOf(Date);
  });

  it('returns null for a request without a session cookie', async () => {
    expect(await inRequest(getSession)).toBeNull();
  });

  it('rejects forged session cookies', async () => {
    const { cookie } = await register('tamper@session.test');
    const forged = cookie
      .split('; ')
      .map((pair) => pair.replace(/=.*/, '=forged-value'))
      .join('; ');
    expect(await inRequest(getSession, forged)).toBeNull();
  });

  it('throws when called outside a request scope', async () => {
    await expect(getSession()).rejects.toThrow(/request scope/);
  });
});

describe('requireUser', () => {
  it('returns the session user for an authenticated request', async () => {
    const { cookie, userId } = await register('page@session.test');
    const user = await inRequest(requireUser, cookie);
    expect(user.id).toBe(userId);
    expect(user.name).toBe('Session Tester');
  });

  it('redirects unauthenticated page requests to /login', async () => {
    expectLoginRedirect(await inRequest(() => rejection(requireUser)));
  });
});

describe('withAuth', () => {
  it('injects the session user and passes client arguments through', async () => {
    const { cookie, userId } = await register('inject@session.test');
    const result = await inRequest(
      () =>
        withAuth(
          (user, spoofed: { userId: string }) => ({
            trusted: user.id,
            spoofed,
          }),
          { userId: 'someone-else' }
        ),
      cookie
    );
    // The injected identity is the session's, never the call's argument.
    expect(result.trusted).toBe(userId);
    expect(result.spoofed.userId).toBe('someone-else');
  });

  it('rejects unauthenticated calls before running the handler', async () => {
    let ran = false;
    const handler = () => {
      ran = true;
    };
    const reason = await inRequest(() => rejection(() => withAuth(handler)));
    expect(ran).toBe(false);
    expectLoginRedirect(reason);
  });
});

describe('getMe', () => {
  it('rejects unauthenticated requests', async () => {
    expectLoginRedirect(await inRequest(() => rejection(getMe)));
  });

  it('returns the trusted session user without a client identity', async () => {
    const { cookie, userId } = await register('me@session.test');
    const user = await inRequest(getMe, cookie);
    expect(user.id).toBe(userId);
    expect(user.email).toBe('me@session.test');
  });
});
