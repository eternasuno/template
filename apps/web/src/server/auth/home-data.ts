'use server';

import { getMeUser } from './get-me.ts';
import { requireUser, type SessionUser } from './session.ts';

export interface HomeData {
  /** Identity enforced by the page-level guard. */
  guard: SessionUser;
  /** Identity returned by the independently protected `getMe` server function. */
  me: SessionUser;
}

/**
 * Loads the data for the protected homepage. The request is authorized twice:
 * first by `requireUser` (which redirects unauthenticated requests to `/login`)
 * and then by the protected `getMe` server function. Both identities come from
 * the ambient session, never from client input.
 */
export async function getHomeData(): Promise<HomeData> {
  const guard = await requireUser();
  const me = await getMeUser();
  return { guard, me };
}
