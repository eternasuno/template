import { surrealAdapter } from '@surrealdb/better-auth';
import { betterAuth } from 'better-auth';
import type { Surreal } from 'surrealdb';

export const auth = betterAuth({
  baseURL: 'http://localhost:3000',
  database: surrealAdapter({ db: {} as Surreal }),
});
