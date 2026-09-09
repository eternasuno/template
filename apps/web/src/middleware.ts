import routes from 'virtual:file-routes';
import { createAPIHandler } from 'filesystem-routing/api';

// Fetch-style middleware array composed in order ahead of page SSR and the
// server-function endpoint. API routes (including Better Auth's /api/auth/*
// catch-all, mounted in a later step) are answered here; everything else
// advances the chain.
export default [createAPIHandler(routes)];
