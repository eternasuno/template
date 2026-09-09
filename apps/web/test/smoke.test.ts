import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('database smoke', () => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'solid-surreal-smoke-')
  );
  const kvEndpoint = `surrealkv://${tempDir.replace(/\\/g, '/')}/kv`;

  beforeAll(() => {
    vi.stubEnv('SURREAL_ENDPOINT', 'mem://');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('connects to mem:// and runs basic queries', async () => {
    const { createSurreal } = await import('../src/server/db/index.ts');
    const db = await createSurreal({
      endpoint: 'mem://',
      namespace: 'app',
      database: 'app',
    });

    const version = await db.version();
    expect(version).toBeDefined();

    const [sum] = await db.query<[number]>('RETURN 1 + 1;');
    expect(sum).toBe(2);

    const [created] = await db.query<[{ id: string; ok: boolean }[]]>(
      'UPSERT smoke:mem SET ok = true;'
    );
    expect(created[0]?.ok).toBe(true);

    await db.close();
  });

  it('reuses the process singleton', async () => {
    const { getDb, closeDb } = await import('../src/server/db/index.ts');

    const a = await getDb();
    const b = await getDb();
    expect(a).toBe(b);

    await closeDb();
  });

  it('persists data to a SurrealKV file store', async () => {
    const { createSurreal } = await import('../src/server/db/index.ts');
    const db = await createSurreal({
      endpoint: kvEndpoint,
      namespace: 'app',
      database: 'app',
    });

    await db.query('UPSERT smoke:kv SET ok = true;');
    const [rows] = await db.query<[{ id: string; ok: boolean }[]]>(
      'SELECT * FROM smoke:kv;'
    );
    expect(rows[0]?.ok).toBe(true);

    await db.close();
  });
});
