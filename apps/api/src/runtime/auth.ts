import { surrealAdapter } from '@surrealdb/better-auth';
import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { Config, Context, Effect, Layer, Redacted } from 'effect';
import { Database } from './db';

export class Auth extends Context.Service<
  Auth,
  ReturnType<typeof betterAuth>
>()('Auth') {}

export const AuthLive = Layer.effect(
  Auth,
  Effect.gen(function* () {
    const authConfig = yield* Config.all({
      url: Config.URL('URL').pipe(
        Config.withDefault(new URL('http://localhost:5173'))
      ),
      secret: Config.Redacted('SECRET'),
    }).pipe(Config.nested('BETTER_AUTH'));
    const origin = yield* Config.URL('FRONTEND_ORIGIN').pipe(
      Config.withDefault(new URL('http://localhost:5173'))
    );
    const db = yield* Database;

    return betterAuth<BetterAuthOptions>({
      appName: 'Solid Surreal API',
      emailAndPassword: { enabled: true },
      telemetry: { enabled: false },
      baseURL: authConfig.url.toString(),
      secret: Redacted.value(authConfig.secret),
      trustedOrigins: [origin.origin],
      database: surrealAdapter({ db }),
    });
  })
);
