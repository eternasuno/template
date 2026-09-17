import { expect, layer } from '@effect/vitest';
import { surrealAdapter } from '@surrealdb/better-auth';
import { Effect } from 'effect';
import { Database } from '../src/runtime/db';
import { TestLayer } from './mock';

type UserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

layer(TestLayer)('in-memory database', (it) => {
  it.effect('applies the auth schema and preserves codec values', () =>
    Effect.gen(function* () {
      const db = yield* Database;
      const adapter = surrealAdapter({ db });
      const options = { database: adapter };
      const now = new Date();
      const created = yield* Effect.tryPromise(() =>
        adapter(options).create<UserRow>({
          model: 'user',
          data: {
            name: 'Codec Probe',
            email: 'codec@probe.test',
            emailVerified: false,
            createdAt: now,
            updatedAt: now,
          },
        })
      );
      const found = yield* Effect.tryPromise(() =>
        adapter(options).findOne<UserRow>({
          model: 'user',
          where: [
            {
              field: 'id',
              value: created.id,
              operator: 'eq',
              connector: 'AND',
              mode: 'sensitive',
            },
          ],
        })
      );

      expect(created.id).not.toContain('user:');
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(found?.email).toBe('codec@probe.test');
      expect(found?.createdAt).toBeInstanceOf(Date);
    })
  );

  it.effect('generates guarded, idempotent schema', () =>
    Effect.gen(function* () {
      const db = yield* Database;
      const adapter = surrealAdapter({ db });
      const options = { database: adapter };
      const createSchema = adapter(options).createSchema;

      if (!createSchema) {
        return yield* Effect.fail(
          new Error('SurrealDB adapter did not provide a schema')
        );
      }

      const schema = yield* Effect.tryPromise(() => createSchema(options));

      if (!schema) {
        return yield* Effect.fail(
          new Error('SurrealDB adapter did not provide a schema')
        );
      }

      yield* Effect.tryPromise(() => db.query(schema.code));
      yield* Effect.tryPromise(() => db.query(schema.code));
      const [info] = yield* Effect.tryPromise(() =>
        db.query<[{ tables: Record<string, string> }]>('INFO FOR DB')
      );
      const statements = schema.code
        .split('\n')
        .filter((line) => line !== '' && !line.startsWith('--'));

      expect(statements.length).toBeGreaterThan(0);
      expect(statements.every((line) => line.includes('IF NOT EXISTS'))).toBe(
        true
      );
      expect(Object.keys(info?.tables ?? {})).toEqual(
        expect.arrayContaining(['user', 'session', 'account', 'verification'])
      );
    })
  );
});
