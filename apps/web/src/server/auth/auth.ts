import { betterAuth } from 'better-auth';
import { getDb } from '../db/index.ts';
import { createAuthOptions } from './config.ts';

const db = await getDb();
const options = createAuthOptions(db);

export const auth = betterAuth(options);
