import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, layer } from '@effect/vitest';
import { Effect, Layer } from 'effect';
import { createSurreal } from '../src/runtime/db';

layer(Layer.empty)('SurrealKV file store', (it) => {
  it.effect('persists data across connections', () =>
    Effect.gen(function* () {
      const tempDir = yield* Effect.acquireRelease(
        Effect.tryPromise(() =>
          fs.mkdtemp(path.join(os.tmpdir(), 'api-surreal-kv-'))
        ),
        (directory) =>
          Effect.promise(() =>
            fs.rm(directory, { recursive: true, force: true })
          )
      );
      const endpoint = `surrealkv://${path.join(tempDir, 'kv').replace(/\\/g, '/')}`;
      const config = { endpoint, namespace: 'app', database: 'app' };

      const db = yield* Effect.acquireRelease(
        Effect.tryPromise(() => createSurreal(config)),
        (connection) => Effect.promise(() => connection.close())
      );

      yield* Effect.tryPromise(() =>
        db.query('UPSERT smoke:kv SET ok = true;')
      );
      const [rows] = yield* Effect.tryPromise(() =>
        db.query<[{ id: string; ok: boolean }[]]>('SELECT * FROM smoke:kv;')
      );

      expect(rows?.[0]?.ok).toBe(true);
    })
  );
});
