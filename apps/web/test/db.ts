import { surrealAdapter } from '@surrealdb/better-auth';
import { createAuthOptions } from '../src/server/auth/config.ts';

export async function setupTestDatabase(): Promise<void> {
  const { getDb } = await import('../src/server/db/index.ts');
  const db = await getDb();
  const options = createAuthOptions(db);
  const schema = await surrealAdapter({ db })(options).createSchema?.(options);

  if (!schema) throw new Error('SurrealDB adapter did not provide a schema');
  await db.query(schema.code);
}
