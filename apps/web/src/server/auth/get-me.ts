import { withAuth } from './session.ts';

export async function getMe() {
  'use server';

  return withAuth((user) => user);
}
