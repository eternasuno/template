import { useNavigate } from '@solidjs/router';
import { createSignal, onCleanup } from 'solid-js';
import { authClient } from './auth-client';

export type SessionState = ReturnType<(typeof authClient.useSession)['get']>;

export const useSession = () => {
  const [session, setSession] = createSignal<SessionState>(
    authClient.useSession.get()
  );
  let unsubscribe: (() => void) | undefined;
  let disposed = false;

  onCleanup(() => {
    disposed = true;
    unsubscribe?.();
  });

  queueMicrotask(() => {
    if (disposed) {
      return;
    }

    unsubscribe = authClient.useSession.subscribe(setSession);
  });

  return session;
};

export const useLogout = () => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = createSignal(false);
  const [logoutError, setLogoutError] = createSignal('');

  const logout = async () => {
    setLogoutError('');
    setLoggingOut(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        setLogoutError(error.message ?? 'Sign out failed.');

        return;
      }

      navigate('/login');
    } catch {
      setLogoutError('Sign out failed. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return { logout, loggingOut, logoutError };
};
