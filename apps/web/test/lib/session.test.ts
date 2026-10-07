import { createRoot } from 'solid-js';
import { expect, it, vi } from 'vitest';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('@solidjs/router', () => ({ useNavigate: () => navigate }));

vi.mock('../../src/lib/auth-client', () => ({
  authClient: {
    useSession: { get: vi.fn(), subscribe: vi.fn() },
    signOut: vi.fn(),
  },
}));

import { authClient } from '../../src/lib/auth-client';
import { useLogout, useSession } from '../../src/lib/session';

it('defers session subscription and unsubscribes on cleanup', async () => {
  const unsubscribe = vi.fn();
  vi.mocked(authClient.useSession.subscribe).mockReturnValue(unsubscribe);
  const dispose = createRoot((dispose) => {
    useSession();

    return dispose;
  });

  expect(authClient.useSession.subscribe).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(authClient.useSession.subscribe).toHaveBeenCalledOnce();
  dispose();
  expect(unsubscribe).toHaveBeenCalledOnce();
});

it('navigates after successful sign out', async () => {
  navigate.mockClear();
  vi.mocked(authClient.signOut).mockResolvedValue({
    data: { success: true },
    error: null,
  });
  await useLogout()();
  expect(navigate).toHaveBeenCalledExactlyOnceWith('/login');
});

it('preserves API sign out errors without navigating', async () => {
  navigate.mockClear();
  vi.mocked(authClient.signOut).mockResolvedValue({
    data: null,
    error: {
      message: 'Session expired.',
      status: 401,
      statusText: 'Unauthorized',
    },
  });
  await expect(useLogout()()).rejects.toThrow('Session expired.');
  expect(navigate).not.toHaveBeenCalled();
});

it('converts network sign out failures without navigating', async () => {
  navigate.mockClear();
  vi.mocked(authClient.signOut).mockRejectedValue(
    new Error('Network unavailable')
  );
  await expect(useLogout()()).rejects.toThrow(
    'Sign out failed. Please try again.'
  );
  expect(navigate).not.toHaveBeenCalled();
});

it('does not subscribe when disposed before the microtask runs', async () => {
  vi.mocked(authClient.useSession.subscribe).mockClear();
  createRoot((dispose) => {
    useSession();
    dispose();
  });

  await Promise.resolve();
  expect(authClient.useSession.subscribe).not.toHaveBeenCalled();
});
