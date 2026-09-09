import { getRequestEvent, redirect } from '@solidjs/web';
import { auth } from './auth.ts';

/** The `{ user, session }` pair Better Auth resolves from the request cookies. */
export type SessionResult = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;
export type SessionUser = SessionResult['user'];

// Unauthenticated requests land here; the login page is mounted on it later.
const loginPath = '/login';

/**
 * The session of the request currently being served, or `null` when it
 * carries no valid session cookie. Identity always comes from the ambient
 * request event — never from client-supplied ids — so this only answers
 * inside a server request scope (page SSR or a server-function call).
 */
export async function getSession(): Promise<SessionResult | null> {
  const event = getRequestEvent();
  if (!event) {
    throw new Error(
      'getSession() must run inside a server request scope (page render or server function)'
    );
  }
  return auth.api.getSession({ headers: event.request.headers });
}

/**
 * The session user, for server-rendered page paths. Throws a `302` redirect
 * `Response` to `/login` when the request has no session; the router turns
 * that into a real redirect during SSR.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw redirect(loginPath);
  return session.user;
}

/**
 * Guards a server-function body: `handler` runs only for an authenticated
 * request and receives the trusted session user as its first argument; any
 * client-supplied arguments ride behind it unchanged. Unauthenticated calls
 * get the same `/login` redirect signal as pages.
 */
export async function withAuth<A extends readonly unknown[], R>(
  handler: (user: SessionUser, ...args: A) => R | Promise<R>,
  ...args: A
): Promise<Awaited<R>> {
  return await handler(await requireUser(), ...args);
}
