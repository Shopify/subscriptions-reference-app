import graphql from '@rollup/plugin-graphql';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import {defineConfig} from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: [
        './tsconfig.json',
        './extensions/buyer-subscriptions/tsconfig.json',
        './extensions/admin-subs-action/tsconfig.json',
      ],
    }),
    graphql(),
  ],
  server: {
    watch: {
      ignored: ['.*\\/node_modules\\/.*', '.*\\/build\\/.*'],
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    // By default vitest v2 uses 'forks' but that fails in CI, possibly because of how our VMs are set up
    pool: 'threads',
    setupFiles: [
      './test/setup-test-env.ts',
      './test/setup-i18n.ts',
      './test/setup-graphql-matchers.ts',
      './test/setup-app-bridge.tsx',
    ],
    include: [
      './app/**/*.test.[jt]s?(x)',
      './extensions/admin-subs-action/**/*.test.[jt]s?(x)',
      './config/**/*.test.[jt]s?(x)',
      './extensions/buyer-subscriptions/**/*.test.[jt]s?(x)',
    ],
    exclude: ['./extensions/**/node_modules/**'],
  },
});
