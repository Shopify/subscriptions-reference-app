import {vitePlugin as remix} from '@remix-run/dev';
import {installGlobals} from '@remix-run/node';
import {defineConfig} from 'vite';
import type {HmrOptions, UserConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

installGlobals();

if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || 'http://localhost')
  .hostname;

let hmrConfig: HmrOptions;
if (host === 'localhost') {
  hmrConfig = {
    protocol: 'ws',
    host: 'localhost',
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: 'wss',
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ['app', 'config/index.ts', 'node_modules'],
      // cachedChecks: false,
    },
  },
  plugins: [
    remix({
      future: {
        unstable_optimizeDeps: true,
      },
      ignoredRouteFiles: ['**/.*'],
    }),
    tsconfigPaths({
      projects: [
        './tsconfig.json',
        './extensions/buyer-subscriptions/tsconfig.json',
        './extensions/admin-subs-action/tsconfig.json',
      ],
    }),
  ],
  build: {
    assetsInlineLimit: 0,
    sourcemap: true,
  },
  optimizeDeps: {
    include: [
      '@shopify/admin-graphql-api-utilities',
      '@shopify/app-bridge-react',
      '@shopify/shopify-app-remix/react',
      '@shopify/polaris-icons',
      '@shopify/address',
      '@rvf/remix',
      '@rvf/zod',
      'zod',
      'uuid',
    ],
  },
}) satisfies UserConfig;
