import { useNavigate } from '@solidjs/router';
import { createEffect, Show } from 'solid-js';
import {
  SessionCard,
  SessionErrorCard,
  SessionLoading,
} from '../components/session-card';
import { useLogout, useSession } from '../lib/session';

const Home = () => {
  const navigate = useNavigate();
  const session = useSession();
  const logout = useLogout();

  createEffect(
    () => {
      const current = session();

      return !current.isPending && !current.data && !current.error;
    },
    (signedOut) => {
      if (signedOut) {
        navigate('/login', { replace: true });
      }
    }
  );

  return (
    <main class="flex min-h-screen items-center justify-center p-4">
      <Show when={!session().isPending} fallback={<SessionLoading />}>
        <Show
          when={!session().error}
          fallback={<SessionErrorCard session={session()} />}
        >
          <SessionCard session={session()} onLogout={logout} />
        </Show>
      </Show>
    </main>
  );
};

export default Home;
