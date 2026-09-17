import { ConfigProvider, Context, Effect, Layer } from 'effect';
import { HttpRouter } from 'effect/unstable/http';
import { migrate } from '../src/migrate';
import { Auth, AuthLive } from '../src/runtime/auth';
import { DatabaseLive } from '../src/runtime/db';

export const testBaseUrl = 'http://localhost:5173';

type TestRoutes = Layer.Layer<
  never,
  never,
  | HttpRouter.HttpRouter
  | HttpRouter.Request<'Error', unknown>
  | HttpRouter.Request<'GlobalError', unknown>
>;

const makeTestApp = (routes: TestRoutes) =>
  HttpRouter.toWebHandler(routes, { disableLogger: true });

export class TestApp extends Context.Service<
  TestApp,
  ReturnType<typeof makeTestApp>
>()('TestApp') {}

export const TestAppLive = (routes: (auth: Auth['Service']) => TestRoutes) =>
  Layer.effect(
    TestApp,
    Effect.gen(function* () {
      const auth = yield* Auth;

      return yield* Effect.acquireRelease(
        Effect.sync(() => makeTestApp(routes(auth))),
        (app) => Effect.promise(() => app.dispose())
      );
    })
  );

const TestConfig = ConfigProvider.layer(
  ConfigProvider.fromUnknown({
    SURREAL: { ENDPOINT: 'mem://', NAMESPACE: 'app', DATABASE: 'app' },
    BETTER_AUTH: {
      URL: testBaseUrl,
      SECRET: 'api-test-secret-not-for-production',
    },
  })
);

export const TestLayer = Layer.effectDiscard(
  Effect.acquireRelease(migrate, () => Effect.void)
).pipe(
  Layer.provideMerge(AuthLive),
  Layer.provideMerge(DatabaseLive),
  Layer.provideMerge(TestConfig)
);
