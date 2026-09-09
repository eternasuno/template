export async function setupTestDatabase(): Promise<void> {
  const { createAuthOptions } = await import('../src/server/auth/config.ts');
  const { surrealAdapter } = await import('@surrealdb/better-auth');
  const { getDb } = await import('../src/server/db/index.ts');
  const db = await getDb();
  const options = createAuthOptions(db);
  const schema = await surrealAdapter({ db })(options).createSchema?.(options);

  if (!schema) throw new Error('SurrealDB adapter did not provide a schema');
  await db.query(schema.code);
}
