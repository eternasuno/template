# Project guide

## Purpose

Self-hosted starter with a pure SolidJS 2 SPA and a separate Effect HttpServer API using Better Auth and embedded SurrealDB/SurrealKV. It is a pnpm workspace managed with Turborepo.

## Structure

- `apps/web/src/routes`: browser-rendered filesystem routes.
- `apps/web/src/components`: shared browser UI.
- `apps/web/src/lib`: Better Auth client and credentialed API clients.
- `apps/api/src/routes`: Effect HTTP routes; Better Auth owns `/api/auth/*`.
- `apps/api/src/runtime`: Effect layers for Better Auth and SurrealDB plus the DB codec.
- `apps/api/src/middleware`: request middleware.
- `apps/api/test`: backend Vitest tests; initialize `mem://` by calling the SurrealDB adapter's `createSchema` directly.
- `apps/api/src/migrate.ts`: one-off schema migration entry point, run via `db:migrate`.

## Boundaries

- Keep `apps/web` browser-only. It must not import `apps/api`, Effect server modules, database clients, embedded engines, secrets, or Better Auth server configuration.
- The web app uses client rendering and HTTP APIs; add no SSR or server functions.
- Derive identity from the backend request session; never trust a client-supplied user ID.
- Protect API operations with `currentUserMiddleware`; derive identity from `CurrentUser`.
- Better Auth owns `/api/auth/*`; internal application operations use Effect HTTP routes.
- Runtime startup connects to SurrealDB but does not generate or apply schema.

## Workflow

- Apply the Better Auth schema with `pnpm --filter api db:migrate`; the script derives DDL from the adapter and applies it directly.
- Keep package tests under each app's `test` directory.
- Before finishing changes, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Read `README.md` for setup, environment variables, routes, and deployment details.
