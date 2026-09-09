import { createAuthClient } from 'better-auth/client';

/**
 * Browser-facing Better Auth client. It speaks directly to the `/api/auth/*`
 * catch-all using same-origin credentials. This module never imports
 * server-only auth configuration; it only uses the public browser protocol.
 */
export const authClient = createAuthClient();
