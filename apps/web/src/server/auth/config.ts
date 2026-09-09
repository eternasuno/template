import { surrealAdapter } from '@surrealdb/better-auth';
import type { BetterAuthOptions } from 'better-auth';
import type { Surreal } from 'surrealdb';

export type AuthConfig = Omit<BetterAuthOptions, 'database'>;

const env = (name: string, fallback: string): string =>
  process.env[name] || fallback;

export const authConfig = {
  appName: 'Solid Surreal Starter',
  baseURL: env('BETTER_AUTH_URL', 'http://localhost:3000'),
  emailAndPassword: { enabled: true },
  telemetry: { enabled: false },
} satisfies AuthConfig;

/** The connected client is owned by the server-only database singleton. */
export function createAuthOptions(db: Surreal): BetterAuthOptions {
  return { ...authConfig, database: surrealAdapter({ db }) };
}
