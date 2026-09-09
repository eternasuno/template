import { surrealAdapter } from '@surrealdb/better-auth';
import type { BetterAuthOptions } from 'better-auth';
import type { Surreal } from 'surrealdb';
import { BETTER_AUTH_URL } from '../../env.ts';

export type AuthConfig = Omit<BetterAuthOptions, 'database'>;

export const authConfig = {
  appName: 'Solid Surreal Starter',
  baseURL: BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  telemetry: { enabled: false },
} satisfies AuthConfig;

/** The connected client is owned by the server-only database singleton. */
export function createAuthOptions(db: Surreal): BetterAuthOptions {
  return { ...authConfig, database: surrealAdapter({ db }) };
}
