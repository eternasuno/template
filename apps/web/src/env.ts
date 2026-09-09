import path from 'node:path';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BETTER_AUTH_URL?: string;
      PORT?: string;
      SURREAL_DATABASE?: string;
      SURREAL_ENDPOINT?: string;
      SURREAL_NAMESPACE?: string;
      VITEST?: string;
    }
  }
}

/** Server/build-only environment constants.
 *
 * All process.env access, defaults, and validation live here. Do not import
 * this module from browser code. */

const defaultDataDir = path.resolve(import.meta.dirname, '../data');
const defaultEndpoint = `surrealkv://${defaultDataDir}`;

const rawSurrealEndpoint = process.env.SURREAL_ENDPOINT;
export const SURREAL_ENDPOINT =
  rawSurrealEndpoint && rawSurrealEndpoint.trim() !== ''
    ? rawSurrealEndpoint
    : defaultEndpoint;

const rawSurrealNamespace = process.env.SURREAL_NAMESPACE;
export const SURREAL_NAMESPACE =
  rawSurrealNamespace && rawSurrealNamespace.trim() !== ''
    ? rawSurrealNamespace
    : 'app';

const rawSurrealDatabase = process.env.SURREAL_DATABASE;
export const SURREAL_DATABASE =
  rawSurrealDatabase && rawSurrealDatabase.trim() !== ''
    ? rawSurrealDatabase
    : 'app';

const DEFAULT_PORT = 3000;
const MIN_PORT = 1;
const MAX_PORT = 65535;

const rawPort = process.env.PORT;
const parsedPort = rawPort ? Number(rawPort) : DEFAULT_PORT;
if (
  !Number.isInteger(parsedPort) ||
  parsedPort < MIN_PORT ||
  parsedPort > MAX_PORT
) {
  throw new Error(
    `PORT must be an integer between ${MIN_PORT} and ${MAX_PORT}, got: ${rawPort}`
  );
}
export const PORT = parsedPort;

const rawBetterAuthUrl = process.env.BETTER_AUTH_URL;
export const BETTER_AUTH_URL =
  rawBetterAuthUrl && rawBetterAuthUrl.trim() !== ''
    ? rawBetterAuthUrl
    : 'http://localhost:3000';
try {
  new URL(BETTER_AUTH_URL);
} catch {
  throw new Error(
    `BETTER_AUTH_URL must be a valid URL, got: ${BETTER_AUTH_URL}`
  );
}

export const VITEST = Boolean(process.env.VITEST);
