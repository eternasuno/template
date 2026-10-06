import { createRoot } from 'solid-js';
import { expect, it, vi } from 'vitest';

vi.mock('@solidjs/router', () => ({ useNavigate: () => vi.fn() }));

vi.mock('../../src/lib/auth-client', () => ({
  authClient: {
    useSession: { get: vi.fn(), subscribe: vi.fn() },
  },
}));

import { authClient } from '../../src/lib/auth-client';
import { useSession } from '../../src/lib/session';

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

it('does not subscribe when disposed before the microtask runs', async () => {
  vi.mocked(authClient.useSession.subscribe).mockClear();
  createRoot((dispose) => {
    useSession();
    dispose();
  });

  await Promise.resolve();
  expect(authClient.useSession.subscribe).not.toHaveBeenCalled();
});
