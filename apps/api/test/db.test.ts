import { surrealAdapter } from '@surrealdb/better-auth';
import type { Surreal } from 'surrealdb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSurreal } from '../src/runtime/db';
import { setupTestDatabase } from './helpers';

interface UserRow {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

let db: Surreal;

const createSchema = async (): Promise<string> => {
  const options = { database: surrealAdapter({ db }) };
  const schema = await surrealAdapter({ db })(options).createSchema?.(options);

  if (!schema) {
    throw new Error('SurrealDB adapter did not provide a schema');
  }

  return schema.code;
};

beforeAll(async () => {
  db = await createSurreal({
    endpoint: 'mem://',
    namespace: 'app',
    database: 'app',
  });
  await setupTestDatabase(db);
}, 30_000);

afterAll(async () => {
  await db.close();
});

describe('database initialization', () => {
  it('applies the generated auth schema idempotently', async () => {
    await setupTestDatabase(db);
    await setupTestDatabase(db);

    const [info] =
      await db.query<[{ tables: Record<string, string> }]>('INFO FOR DB');
    expect(Object.keys(info?.tables ?? {})).toEqual(
      expect.arrayContaining(['user', 'session', 'account', 'verification'])
    );
  });

  it('emits only guarded DDL statements', async () => {
    const statements = (await createSchema())
      .split('\n')
      .filter((line) => line !== '' && !line.startsWith('--'));
    expect(statements.length).toBeGreaterThan(0);
    expect(statements.every((line) => line.includes('IF NOT EXISTS'))).toBe(
      true
    );
  });

  it('normalizes record ids and dates across the codec', async () => {
    const options = { database: surrealAdapter({ db }) };
    const adapter = surrealAdapter({ db })(options);
    const now = new Date();

    const created = await adapter.create<UserRow>({
      model: 'user',
      data: {
        name: 'Probe',
        email: 'codec@probe.test',
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    });
    expect(created.id).toEqual(expect.any(String));
    expect(created.id).not.toContain('user:');
    expect(created.createdAt).toBeInstanceOf(Date);

    const found = await adapter.findOne<UserRow>({
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
    });
    expect(found?.email).toBe('codec@probe.test');
  });
});
