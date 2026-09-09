import { useNavigate } from '@solidjs/router';
import { defineFileRoute } from '@solidjs/router/fs';
import { createSignal } from 'solid-js';
import { authClient } from '../lib/auth-client.ts';
import { getHomeData, type HomeData } from '../server/auth/home-data.ts';

// Solid Router's preload contract is typed synchronously, but the runtime
// awaits the returned Promise during SSR. The cast keeps the type honest on
// our side without changing behavior.
export const route = defineFileRoute<'/', HomeData>('/', {
  preload: (() => getHomeData()) as unknown as () => HomeData,
});

interface HomeProps {
  data: HomeData;
}

interface HomeContentProps {
  data: HomeData;
  loggingOut: boolean;
  logoutError: string;
  onLogout: () => void;
}

function HomeContent(props: HomeContentProps) {
  return (
    <main class="flex min-h-screen items-center justify-center p-4">
      <div class="card w-full max-w-md bg-base-100 shadow-xl">
        <div class="card-body">
          <h1 class="card-title">Welcome, {props.data.me.name}</h1>
          <p class="text-base-content/70">{props.data.me.email}</p>
          <div class="divider" />
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="font-medium">Guard identity</dt>
              <dd>{props.data.guard.email}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="font-medium">getMe identity</dt>
              <dd>{props.data.me.email}</dd>
            </div>
          </dl>
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
}

export default function Home(props: HomeProps) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = createSignal(false);
  const [logoutError, setLogoutError] = createSignal('');

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
    <HomeContent
      data={props.data}
      loggingOut={loggingOut()}
      logoutError={logoutError()}
      onLogout={handleLogout}
    />
  );
}
