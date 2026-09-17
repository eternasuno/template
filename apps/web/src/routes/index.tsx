import { useNavigate } from '@solidjs/router';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { FormError } from '../components/auth-form';
import { authClient } from '../lib/auth-client';

type SessionState = ReturnType<(typeof authClient.useSession)['get']>;

const Spinner = () => (
  <div class="loading loading-spinner loading-lg" role="status">
    <span class="sr-only">Loading session</span>
  </div>
);

const useLogout = () => {
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

interface SessionCardProps {
  session: SessionState;
  loggingOut: boolean;
  logoutError: string;
  onLogout: () => void;
}

const SessionCard = (props: SessionCardProps) => (
  <div class="card card-border w-full max-w-sm bg-base-100 shadow-xl">
    <div class="card-body">
      <Show when={props.session.data}>
        {(data) => (
          <>
            <h1 class="card-title">Welcome, {data().user.name}</h1>
            <p class="text-base-content/70">{data().user.email}</p>
            <FormError message={props.logoutError} />
            <div class="card-actions justify-end">
              <button
                type="button"
                class="btn btn-outline"
                onClick={props.onLogout}
                disabled={props.loggingOut}
                aria-busy={props.loggingOut ? 'true' : 'false'}
              >
                {props.loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </>
        )}
      </Show>
    </div>
  </div>
);

const SessionErrorCard = (props: { session: SessionState }) => (
  <div class="card card-border w-full max-w-sm bg-base-100 shadow-xl">
    <div class="card-body">
      <h1 class="card-title text-error">Unable to load your session</h1>
      <FormError message={props.session.error?.message ?? 'Failed to load your session.'} />
      <div class="card-actions justify-end">
        <button
          type="button"
          class="btn btn-primary"
          onClick={() => void props.session.refetch()}
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [session, setSession] = createSignal<SessionState>(authClient.useSession.get());
  const { logout, loggingOut, logoutError } = useLogout();

  onCleanup(authClient.useSession.subscribe(setSession));

  createEffect(
    () => {
      const current = session();

      return !current.isPending && !current.data && !current.error;
    },
    (shouldRedirect) => {
      if (shouldRedirect) {
        navigate('/login', { replace: true });
      }
    }
  );

  return (
    <main class="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <Show when={!session().isPending} fallback={<Spinner />}>
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
