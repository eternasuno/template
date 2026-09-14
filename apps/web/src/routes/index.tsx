import { useNavigate } from '@solidjs/router';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { authClient } from '../lib/auth-client';

interface HomeContentProps {
  name: string;
  email: string;
  loggingOut: boolean;
  logoutError: string;
  onLogout: () => void;
}

const HomeContent = (props: HomeContentProps) => {
  return (
    <main class="flex min-h-screen items-center justify-center p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body">
          <h1 class="card-title">Welcome, {props.name}</h1>
          <p class="text-base-content/70">{props.email}</p>
          <div class="divider" />
          <div class="card-actions justify-end">
            <button
              type="button"
              class="btn btn-primary"
              onClick={props.onLogout}
              disabled={props.loggingOut}
              aria-busy={props.loggingOut ? 'true' : 'false'}
            >
              {props.loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
          {props.logoutError && (
            <p class="text-error text-sm" role="alert" aria-live="assertive">
              {props.logoutError}
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

const LoadingHome = () => (
  <main class="flex min-h-screen items-center justify-center p-4">
    <div class="loading loading-spinner loading-lg" role="status">
      <span class="sr-only">Loading session</span>
    </div>
  </main>
);

interface HomeErrorProps {
  message: string;
  onRetry: () => void;
}

const HomeError = (props: HomeErrorProps) => (
  <main class="flex min-h-screen items-center justify-center p-4">
    <div class="card w-full max-w-md bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 class="card-title text-error">Unable to load your session</h1>
        <p class="text-base-content/70" role="alert" aria-live="assertive">
          {props.message}
        </p>
        <div class="card-actions justify-end">
          <button type="button" class="btn btn-primary" onClick={props.onRetry}>
            Try again
          </button>
        </div>
      </div>
    </div>
  </main>
);

const Home = () => {
  const [session, setSession] = createSignal(authClient.useSession.get());
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = createSignal(false);
  const [logoutError, setLogoutError] = createSignal('');

  onCleanup(authClient.useSession.subscribe(setSession));

  createEffect(
    () => !session().isPending && !session().data && !session().error,
    (redirect) => void (redirect && navigate('/login', { replace: true }))
  );

  const handleLogout = async () => {
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

  return (
    <Show when={!session().isPending} fallback={<LoadingHome />}>
      <Show
        when={session().error}
        fallback={
          <Show when={session().data}>
            {(sessionData) => (
              <HomeContent
                name={sessionData().user.name}
                email={sessionData().user.email}
                loggingOut={loggingOut()}
                logoutError={logoutError()}
                onLogout={handleLogout}
              />
            )}
          </Show>
        }
      >
        {(error) => (
          <HomeError
            message={error().message ?? 'Failed to load your session.'}
            onRetry={() => void session().refetch()}
          />
        )}
      </Show>
    </Show>
  );
};

export default Home;
