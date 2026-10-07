import { Show } from 'solid-js';
import { createAuthAction } from '../lib/auth-form';
import type { SessionState } from '../lib/session';
import { FormError } from './form-error';

export const SessionLoading = () => (
  <div class="flex items-center gap-2" role="status">
    <span class="loading loading-spinner" aria-hidden="true" />
    <span>Loading session…</span>
  </div>
);

type SessionCardProps = {
  session: SessionState;
  onLogout: () => Promise<void>;
};

export const SessionCard = (props: SessionCardProps) => {
  const logout = createAuthAction();

  return (
    <section class="card card-border w-full max-w-2xl">
      <div class="card-body">
        <Show when={props.session.data}>
          {(data) => (
            <>
              <h1 class="card-title">Welcome, {data().user.name}</h1>
              <span class="badge">Signed in</span>
              <dl class="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt>Name</dt>
                  <dd>{data().user.name}</dd>
                </div>
                <div class="min-w-0">
                  <dt>Email address</dt>
                  <dd class="break-words">{data().user.email}</dd>
                </div>
                <div>
                  <dt>Account status</dt>
                  <dd>Active</dd>
                </div>
                <div>
                  <dt>Architecture</dt>
                  <dd>SolidJS + SurrealKV + Effect</dd>
                </div>
              </dl>
              <FormError message={logout.error()} />
              <div class="card-actions justify-end">
                <button
                  type="button"
                  class="btn"
                  onClick={() =>
                    void logout.run(
                      props.onLogout,
                      'Sign out failed. Please try again.'
                    )
                  }
                  disabled={logout.pending()}
                  aria-busy={logout.pending() ? 'true' : 'false'}
                >
                  <Show when={logout.pending()}>
                    <span
                      class="loading loading-spinner loading-sm"
                      aria-hidden="true"
                    />
                  </Show>
                  <span>{logout.pending() ? 'Signing out…' : 'Sign out'}</span>
                </button>
              </div>
            </>
          )}
        </Show>
      </div>
    </section>
  );
};

export const SessionErrorCard = (props: { session: SessionState }) => (
  <section class="card card-border w-full max-w-md">
    <div class="card-body">
      <h1 class="card-title">Unable to load your session</h1>
      <FormError
        message={props.session.error?.message ?? 'Failed to load your session.'}
      />
      <div class="card-actions justify-end">
        <button
          type="button"
          class="btn"
          onClick={() => void props.session.refetch()}
        >
          Try again
        </button>
      </div>
    </div>
  </section>
);
