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

  return async () => {
    let result: Awaited<ReturnType<typeof authClient.signOut>>;

    try {
      result = await authClient.signOut();
    } catch {
      throw new Error('Sign out failed. Please try again.');
    }

    if (result.error) {
      throw new Error(result.error.message ?? 'Sign out failed.');
    }

    navigate('/login');
  };
};
