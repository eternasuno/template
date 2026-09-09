import { betterAuth } from 'better-auth';
import { surrealAdapter } from '@surrealdb/better-auth';
import type { Surreal } from 'surrealdb';
import { authConfig } from './src/server/auth/config.ts';

export const auth = betterAuth({
  ...authConfig,
  database: surrealAdapter({ db: {} as Surreal }),
});
