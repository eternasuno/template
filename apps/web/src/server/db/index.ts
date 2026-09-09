import { createNodeEngines } from '@surrealdb/node';
import {
  RecordId,
  StringRecordId,
  Surreal,
  type CodecOptions,
} from 'surrealdb';

export interface DbConfig {
  endpoint: string;
  namespace: string;
  database: string;
}

const orDefault = (value: string | undefined, fallback: string): string =>
  value && value.trim() !== '' ? value : fallback;

const env = (name: string): string | undefined => process.env[name];

export const dbConfig: DbConfig = {
  endpoint: orDefault(env('SURREAL_ENDPOINT'), 'surrealkv://./data'),
  namespace: orDefault(env('SURREAL_NAMESPACE'), 'app'),
  database: orDefault(env('SURREAL_DATABASE'), 'app'),
};

interface ForeignRecordId {
  table: string | { name: string };
  id: string | number;
}

// @surrealdb/better-auth 0.1.0 bundles its own SurrealDB value classes, so its
// RecordIds are opaque to this SDK's codec and this SDK's RecordIds are opaque
// to the adapter. Both visitors normalize that boundary; decoding record ids
// to bare string ids is also what Better Auth adapters expect.
function isForeignRecordId(value: object): value is ForeignRecordId {
  const proto = Object.getPrototypeOf(value);
  return (
    proto !== null &&
    proto !== Object.prototype &&
    'table' in value &&
    'id' in value &&
    typeof (value as { equals?: unknown }).equals === 'function'
  );
}

function normalizeEncoded(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;
  if (value instanceof RecordId || value instanceof StringRecordId)
    return value;
  if (!isForeignRecordId(value)) return value;
  const table =
    typeof value.table === 'string' ? value.table : value.table.name;
  return new RecordId(table, value.id);
}

const normalizeDecoded = (value: unknown): unknown =>
  value instanceof RecordId ? String(value.id) : value;

export const codecOptions: CodecOptions = {
  useNativeDates: true,
  valueEncodeVisitor: normalizeEncoded,
  valueDecodeVisitor: normalizeDecoded,
};

/** Opens a connection to `config.endpoint`, ready for queries. */
export async function createSurreal(
  config: DbConfig = dbConfig
): Promise<Surreal> {
  const db = new Surreal({ engines: { ...createNodeEngines() }, codecOptions });
  await db.connect(config.endpoint, {
    namespace: config.namespace,
    database: config.database,
  });
  return db;
}

const singletonKey = 'solidSurrealStarterDb';

type DbGlobal = typeof globalThis & { [singletonKey]?: Promise<Surreal> };

const globalScope = globalThis as DbGlobal;

let shutdownRegistered = false;

function registerShutdown(): void {
  if (shutdownRegistered || env('VITEST')) return;
  shutdownRegistered = true;
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void closeDb().then(
        () => process.exit(0),
        () => process.exit(1)
      );
    });
  }
}

/** The process-wide embedded Surreal connection, opened once and reused across HMR. */
export function getDb(): Promise<Surreal> {
  const existing = globalScope[singletonKey];
  if (existing) return existing;
  const opening = createSurreal().then((db) => {
    registerShutdown();
    return db;
  });
  globalScope[singletonKey] = opening;
  void opening.catch(() => {
    if (globalScope[singletonKey] === opening) delete globalScope[singletonKey];
  });
  return opening;
}

/** Closes and forgets the singleton so a later `getDb()` reconnects. */
export async function closeDb(): Promise<void> {
  const opening = globalScope[singletonKey];
  delete globalScope[singletonKey];
  if (!opening) return;
  await (await opening).close();
}
