import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createSurreal } from '../src/runtime/db';

describe('database smoke', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-surreal-smoke-'));
  const kvEndpoint = `surrealkv://${tempDir.replace(/\\/g, '/')}/kv`;

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('connects to mem:// and runs basic queries', async () => {
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

  it('persists data to a SurrealKV file store', async () => {
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
