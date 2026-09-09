# Solid Surreal Starter

A self-hosted full-stack starter built with SolidJS 2 SSR/start mode, server functions, embedded SurrealDB/SurrealKV, Better Auth, Tailwind CSS v4, and DaisyUI v5. The workspace uses pnpm and Turborepo.

## Prerequisites

- Node.js **22.12 or newer**
- pnpm **12.3.4** (`corepack enable` can manage the package-manager version)

Install dependencies from the repository root:

```sh
pnpm install
```

Copy `.env.example` to `.env` and set `BETTER_AUTH_SECRET` to a long random value. The default development database is an embedded SurrealKV store at `./data`; keep this directory out of version control. `BETTER_AUTH_URL` should match the app origin when deployed.

## Commands

Run commands from the repository root:

```sh
pnpm dev        # start the web app in development
pnpm build      # create the production build
pnpm typecheck  # type-check every workspace package
pnpm test       # run Vitest tests
pnpm lint       # lint with Biome
pnpm format     # format files with Biome
pnpm check      # Biome checks plus workspace type-checking
```

The app runs on port `3000` by default (`PORT` overrides it).

## Architecture

```text
Browser UI
  -> Solid server function
  -> session guard
  -> server-only module
  -> embedded SurrealDB / SurrealKV
```

`apps/web` is the runtime application. Files under `apps/web/src/routes` are filesystem-routed pages and API handlers; `apps/web/src/server` contains request-aware server functions, authentication, and persistence. Vite is configured for SSR, `start`, and server functions. Root tooling and shared configuration stay at the workspace root.

### Embedded SurrealDB

`apps/web/src/server/db/index.ts` owns a process-global `Surreal` singleton. It installs the Node embedded engines, connects to `SURREAL_ENDPOINT`, and selects `SURREAL_NAMESPACE` and `SURREAL_DATABASE`. The singleton is stored on `globalThis` so development HMR reuses the connection; SIGINT/SIGTERM close it cleanly.

Generate the Better Auth SurrealQL schema before deployment, then apply the generated file with SurrealDB deployment tooling:

```sh
pnpm --filter web db:generate
```

The command uses Better Auth CLI with `apps/web/auth.config.ts` and writes the ignored deployment artifact to `apps/web/data/auth-schema.surql`. Runtime startup does not generate or apply schema.

Use these environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SURREAL_ENDPOINT` | `surrealkv://./data` | Embedded persistent store; use `mem://` for ephemeral runs and tests |
| `SURREAL_NAMESPACE` | `app` | SurrealDB namespace |
| `SURREAL_DATABASE` | `app` | SurrealDB database |
| `BETTER_AUTH_SECRET` | — | Required production secret |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Canonical auth origin |
| `PORT` | `3000` | Development/server port |

The SDK boundary normalizes record IDs between the official Better Auth adapter and the application SDK, enables native dates, and exposes string IDs to auth code.

### Better Auth flow

`apps/web/src/server/auth/auth.ts` creates Better Auth with the official SurrealDB adapter and email/password enabled. `getSession()` in `session.ts` reads headers from the current Solid request event and asks Better Auth to resolve the cookie-backed session. `requireUser()` redirects unauthenticated page requests to `/login`; `withAuth()` applies the same guard to server functions and supplies the trusted session user as the first argument. Application identity always comes from that request session, never from a client-provided user ID.

The browser auth client uses Better Auth's protocol for registration, login, session handling, and logout. The catch-all `GET`/`POST` handler at `/api/auth/*` delegates web requests to `auth.handler(request)`. No application route should reimplement that protocol.

### Routes

- `/register` — name, email, password, and confirmation form.
- `/login` — email/password form.
- `/` — protected authentication-status page; it loads protected home data and calls `getMe()`.
- `/api/auth/*` — Better Auth's catch-all API protocol.

## Server-only boundaries

Database and auth modules must remain server-only. Import `apps/web/src/server/**` only from SSR code or server functions; do not import them into browser components or `apps/web/src/lib/auth-client.ts`. Server functions use the `'use server'` boundary (for example, `home-data.ts`), and must validate/authorize from the ambient request session before touching persistence. Keep secrets, the embedded engine, database clients, and Better Auth configuration out of client-side imports and serialized data.

## Tests

Vitest tests live in `apps/web/test`. They configure `SURREAL_ENDPOINT=mem://` and call the adapter's `createSchema` directly to initialize isolated databases. Auth/page tests use request-event context and real Better Auth handlers to cover missing-session redirects, authenticated identity, and protected `getMe` behavior. Database tests cover initialization and lifecycle. Run the full suite with `pnpm test`; the expected acceptance checks are `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.

## Extension points

- Add a page or API endpoint under `apps/web/src/routes` and let filesystem routing register it.
- Add protected application operations as `'use server'` functions, wrapping them with `withAuth()` and deriving identity from its injected user.
- Extend persistence in `apps/web/src/server/db`; generate Better Auth schema through the CLI as part of deployment.
- Add auth capabilities through Better Auth configuration in `apps/web/src/server/auth/config.ts`; retain `/api/auth/*` as the protocol boundary.
- Add domain modules below `apps/web/src/server` without introducing a separate server app, ORM, queue, Redis, OAuth provider, or external SurrealDB service unless the starter's constraints are intentionally revised.
