# Project guide

## Purpose

Self-hosted full-stack starter using SolidJS 2 SSR/server functions, embedded SurrealDB/SurrealKV, Better Auth email/password authentication, Tailwind CSS v4, and DaisyUI v5. It is a pnpm workspace managed with Turborepo.

## Structure

- `apps/web/src/routes`: filesystem-routed pages and Better Auth API handler.
- `apps/web/src/components`: shared UI components.
- `apps/web/src/lib`: browser-safe clients and utilities.
- `apps/web/src/server/auth`: Better Auth configuration, request session guards, and protected server functions.
- `apps/web/src/server/db`: server-only embedded SurrealDB connection lifecycle.
- `apps/web/test`: Vitest tests; initialize `mem://` by calling the SurrealDB adapter's `createSchema` directly.
- `apps/web/auth.config.ts`: side-effect-free Better Auth CLI configuration used to generate deployment schema.
- Root configuration files: shared TypeScript, Biome, pnpm, and Turborepo tooling.

## Boundaries

- Keep database clients, embedded engines, secrets, and Better Auth server configuration out of browser bundles.
- Derive identity from the request session; never trust a client-supplied user ID.
- Protect pages with `requireUser` and server functions with `withAuth`.
- Better Auth owns `/api/auth/*`; internal application operations use server functions.
- Runtime startup connects to SurrealDB but does not generate or apply schema.

## Workflow

- Generate deployment schema with `pnpm --filter web db:generate`, then apply the ignored `apps/web/data/auth-schema.surql` using deployment tooling.
- Keep tests under `apps/web/test`, not beside production code.
- Before finishing changes, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Read `README.md` for setup, environment variables, routes, and deployment details.
