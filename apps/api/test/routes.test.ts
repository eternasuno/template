import { expect, layer } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { HttpRouter, HttpServerResponse } from 'effect/unstable/http';
import { CurrentUser, currentUserMiddleware } from '../src/middleware/session';
import { Auth } from '../src/runtime/auth';
import { TestApp, TestAppLive, TestLayer, testBaseUrl } from './mock';

const SessionTestLayer = TestAppLive((auth) =>
  HttpRouter.add(
    'GET',
    '/protected',
    Effect.flatMap(CurrentUser, (user) => HttpServerResponse.json(user))
  ).pipe(
    Layer.provide(currentUserMiddleware.layer),
    Layer.provide(Layer.succeed(Auth, auth))
  )
).pipe(Layer.provideMerge(TestLayer));

layer(SessionTestLayer)('session middleware', (it) => {
  it.effect('rejects requests without a session', () =>
    Effect.gen(function* () {
      const app = yield* TestApp;
      const response = yield* Effect.tryPromise(() =>
        app.handler(new Request(`${testBaseUrl}/protected`))
      );
      const body = yield* Effect.tryPromise(() => response.json());

      expect(response.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    })
  );
});
