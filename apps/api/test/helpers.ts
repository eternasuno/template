import { surrealAdapter } from '@surrealdb/better-auth';
import { ConfigProvider, Layer, ManagedRuntime } from 'effect';
import { HttpRouter } from 'effect/unstable/http';
import type { Surreal } from 'surrealdb';
import { AppLive } from '../src/app';
import { AuthLive } from '../src/runtime/auth';
import { createSurreal, Database, DatabaseLive } from '../src/runtime/db';

export const testSecret = 'api-test-secret-not-for-production';
export const testBaseUrl = 'http://localhost:5173';

export interface TestApp {
  readonly handler: (request: Request) => Promise<Response>;
  readonly dispose: () => Promise<void>;
}

const provider = () =>
  ConfigProvider.fromUnknown({
    SURREAL: { ENDPOINT: 'mem://', NAMESPACE: 'app', DATABASE: 'app' },
    BETTER_AUTH: { URL: testBaseUrl, SECRET: testSecret },
    FRONTEND_ORIGIN: testBaseUrl,
  });

export const createTestDatabase = (): Promise<Surreal> =>
  createSurreal({ endpoint: 'mem://', namespace: 'app', database: 'app' });

export const setupTestDatabase = async (db: Surreal): Promise<void> => {
  const options = { database: surrealAdapter({ db }) };
  const schema = await surrealAdapter({ db })(options).createSchema?.(options);

  if (!schema) {
    throw new Error('SurrealDB adapter did not provide a schema');
  }

  await db.query(schema.code);
};

export const createTestApp = (db: Surreal): TestApp =>
  HttpRouter.toWebHandler(
    AppLive.pipe(
      Layer.provide(
        AuthLive.pipe(Layer.provideMerge(Layer.succeed(Database, db)))
      ),
      Layer.provide(ConfigProvider.layer(provider()))
    ),
    { disableLogger: true }
  );

export const createTestRuntime = () =>
  ManagedRuntime.make(
    AuthLive.pipe(Layer.provideMerge(DatabaseLive)).pipe(
      Layer.provide(ConfigProvider.layer(provider()))
    )
  );
