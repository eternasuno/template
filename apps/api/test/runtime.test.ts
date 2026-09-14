import { afterAll, describe, expect, it } from 'vitest';
import { Auth } from '../src/runtime/auth';
import { Database } from '../src/runtime/db';
import { createTestRuntime } from './helpers';

describe('api runtime lifecycle', () => {
  const runtime = createTestRuntime();

  afterAll(async () => {
    await runtime.dispose();
  });

  it('reuses the same auth and database services across runs', async () => {
    const first = await runtime.runPromise(Database);
    const second = await runtime.runPromise(Database);
    const auth = await runtime.runPromise(Auth);

    expect(first).toBe(second);
    expect(auth).toBeDefined();
  });

  it('disposes idempotently', async () => {
    await runtime.dispose();
    await runtime.dispose();
  });
});
