import { withAuth } from './session.ts';

export async function getMeUser() {
  return withAuth((user) => user);
}

export async function getMe() {
  'use server';

  return getMeUser();
}
