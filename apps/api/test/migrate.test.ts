import { expect, layer } from '@effect/vitest';
import { Effect } from 'effect';
import { Database } from '../src/runtime/db';
import { TestLayer } from './mock';

layer(TestLayer)('auth migration', (it) => {
  it.effect('applies the generated schema', () =>
    Effect.gen(function* () {
      const db = yield* Database;
      const [info] = yield* Effect.tryPromise(() =>
        db.query<[{ tables: Record<string, string> }]>('INFO FOR DB')
      );

      expect(Object.keys(info?.tables ?? {})).toEqual(
        expect.arrayContaining(['user', 'session', 'account', 'verification'])
      );
    })
  );
});
