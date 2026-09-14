import { createAuthClient } from 'better-auth/client';

// Browser-only boundary: never import server-only auth configuration here.
export const authClient = createAuthClient({
  fetchOptions: {
    credentials: 'include',
  },
});
