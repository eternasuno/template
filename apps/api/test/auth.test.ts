import { expect, layer } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { AppLive } from '../src/app';
import { Auth } from '../src/runtime/auth';
import { TestApp, TestAppLive, TestLayer, testBaseUrl } from './mock';

const password = 'correct horse battery staple';
const jsonHeaders = {
  'content-type': 'application/json',
  origin: testBaseUrl,
};

const cookieHeader = (response: Response): string =>
  response.headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(';')[0] ?? '')
    .join('; ');

const AuthTestLayer = TestAppLive((auth) =>
  AppLive.pipe(Layer.provide(Layer.succeed(Auth, auth)))
).pipe(Layer.provideMerge(TestLayer));

layer(AuthTestLayer)('email/password HTTP auth', (it) => {
  it.effect('registers, signs in, and signs out', () =>
    Effect.gen(function* () {
      const app = yield* TestApp;
      const email = 'flow@api.test';
      const register = yield* Effect.tryPromise(() =>
        app.handler(
          new Request(`${testBaseUrl}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ name: 'Flow Tester', email, password }),
          })
        )
      );
      const signIn = yield* Effect.tryPromise(() =>
        app.handler(
          new Request(`${testBaseUrl}/api/auth/sign-in/email`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ email, password }),
          })
        )
      );
      const cookie = cookieHeader(signIn);
      const signOut = yield* Effect.tryPromise(() =>
        app.handler(
          new Request(`${testBaseUrl}/api/auth/sign-out`, {
            method: 'POST',
            headers: { ...jsonHeaders, cookie },
          })
        )
      );

      expect(register.ok).toBe(true);
      expect(signIn.ok).toBe(true);
      expect(cookie.length).toBeGreaterThan(0);
      expect(signOut.ok).toBe(true);
    })
  );

  it.effect('rejects invalid credentials', () =>
    Effect.gen(function* () {
      const app = yield* TestApp;
      const response = yield* Effect.tryPromise(() =>
        app.handler(
          new Request(`${testBaseUrl}/api/auth/sign-in/email`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({
              email: 'missing@api.test',
              password,
            }),
          })
        )
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    })
  );
});
