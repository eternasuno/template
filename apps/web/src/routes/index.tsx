import { useNavigate } from '@solidjs/router';
import { createTrackedEffect, Show } from 'solid-js';
import {
  SessionCard,
  SessionErrorCard,
  SessionLoading,
} from '../components/session-card';
import { useLogout, useSession } from '../lib/session';

const Home = () => {
  const navigate = useNavigate();
  const session = useSession();
  const { logout, loggingOut, logoutError } = useLogout();

  createTrackedEffect(() => {
    const current = session();

    if (!current.isPending && !current.data && !current.error) {
      navigate('/login', { replace: true });
    }
  });

  return (
    <main class="relative flex min-h-screen w-full items-center justify-center bg-[#faf8f5] px-4 py-8 sm:px-6 lg:px-8">
      <Show when={!session().isPending} fallback={<SessionLoading />}>
        <Show
          when={!session().error}
          fallback={<SessionErrorCard session={session()} />}
        >
          <SessionCard
            session={session()}
            loggingOut={loggingOut()}
            logoutError={logoutError()}
            onLogout={() => void logout()}
          />
        </Show>
      </Show>
    </main>
  );
};

export default Home;
