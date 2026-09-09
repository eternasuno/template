import solid from '@solidjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { PageFileSystemRouter } from 'filesystem-routing';
import { fileRoutes } from 'filesystem-routing/vite';
import { defineConfig } from 'vitest/config';

// Match BETTER_AUTH_URL / PORT from the root .env.example.
const port = 3000;

const routeExtensions = ['js', 'jsx', 'ts', 'tsx'];

export default defineConfig({
  plugins: [
    solid({
      ssr: true,
      start: {
        // Fronts page SSR and the server-function endpoint; hosts the
        // filesystem-routing API dispatch (e.g. Better Auth's /api/auth/*).
        middleware: './src/middleware.ts',
      },
      serverFunctions: {
        // Server-only module pinned into the handler graph; registers the
        // router's single-flight data collector before the first dispatch.
        configure: './src/server-config.ts',
      },
      // Route modules are delivered with `?pick=` query-suffixed ids, which
      // the default extension match would miss; registering them here keeps
      // code-split route chunks compiled by Solid.
      extensions: ['.jsx', '.tsx'],
    }),
    fileRoutes({
      // API handler exports belong to the server manifest only, so handler
      // code never enters the client bundle.
      routers: {
        client: new PageFileSystemRouter({
          dir: 'src/routes',
          extensions: routeExtensions,
        }),
        ssr: new PageFileSystemRouter({
          dir: 'src/routes',
          extensions: routeExtensions,
          httpMethods: true,
        }),
      },
    }),
    tailwindcss(),
  ],
  server: { port },
  preview: { port },
  test: {
    // The Solid plugin defaults tests to a jsdom client posture; this app's
    // tests are server-runtime (sessions, guards, database on mem://), and
    // DOM projects can opt into jsdom explicitly when UI tests land.
    environment: 'node',
  },
});
