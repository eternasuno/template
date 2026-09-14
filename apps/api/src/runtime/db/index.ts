import { existsSync } from 'node:fs';
import path from 'node:path';
import { createNodeEngines } from '@surrealdb/node';
import { Config, Context, Effect, Layer } from 'effect';
import { Surreal } from 'surrealdb';
import { codecOptions } from './codec.ts';

const packageRoot = (from: string): string => {
  let dir = from;
  while (!existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`Cannot locate a package.json above ${from}`);
    }
    dir = parent;
  }
  return dir;
};

// Anchor the embedded store to this package, not `process.cwd()`, so every
// entry point (dev, `dist/server.js`, tests) opens the same database.
const defaultDataDir = path.join(packageRoot(import.meta.dirname), 'data');
const defaultEndpoint = `surrealkv://${defaultDataDir}`;

export interface DbConfig {
  endpoint: string;
  namespace: string;
  database: string;
}

export class Database extends Context.Service<Database, Surreal>()(
  'Database'
) {}

export const createSurreal = async (config: DbConfig): Promise<Surreal> => {
  const db = new Surreal({ engines: { ...createNodeEngines() }, codecOptions });
  await db.connect(config.endpoint, {
    namespace: config.namespace,
    database: config.database,
  });

  return db;
};

export const DatabaseLive = Layer.effect(
  Database,
  Effect.gen(function* () {
    const config = yield* Config.all({
      endpoint: Config.String('ENDPOINT').pipe(
        Config.withDefault(defaultEndpoint)
      ),
      namespace: Config.String('NAMESPACE').pipe(Config.withDefault('app')),
      database: Config.String('DATABASE').pipe(Config.withDefault('app')),
    }).pipe(Config.nested('SURREAL'));
    const db = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: () => createSurreal(config),
        catch: (cause) => cause,
      }),
      (db) => Effect.promise(() => db.close())
    );

    return db;
  })
);
