import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    root: __dirname,
    cacheDir: '../node_modules/.vite/media-worker',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      ssr: true, // Server-side rendering mode for Node.js
      target: 'node22',
      format: 'esm',
      sourcemap: !isProduction, // Sourcemaps for development
      minify: isProduction, // Minify for production
      rollupOptions: {
        input: {
          index: join(__dirname, 'src/main.ts'),
        },
        output: {
          entryFileNames: '[name].js',
          format: 'es',
          manualChunks: undefined,
        },
        external: (id) => {
          // Handle undefined or null id
          if (!id) return false;

          // Node.js built-ins
          if (
            [
              'fs',
              'path',
              'url',
              'http',
              'https',
              'stream',
              'util',
              'crypto',
              'os',
              'events',
              'buffer',
              'querystring',
              'zlib',
              'net',
              'tls',
              'child_process',
              'cluster',
              'dgram',
              'dns',
              'readline',
              'repl',
              'string_decoder',
              'tty',
              'vm',
              'worker_threads',
            ].includes(id)
          ) {
            return true;
          }
          // Database drivers and native modules
          if (
            [
              'dotenv',
              'knex',
              'pg',
              'mysql',
              'mysql2',
              'sqlite3',
              'better-sqlite3',
              'tedious',
              'oracledb',
              'pg-query-stream',
            ].includes(id)
          ) {
            return true;
          }
          // Keep all node_modules external by default, EXCEPT workspace packages
          if (/^node:/.test(id)) {
            return true;
          }
          // Bundle monorepo workspaces so production Docker only needs app dist + npm deps (no
          // per-package COPY in the Dockerfile).
          if (id.startsWith('@app/') || id.startsWith('@packages/')) {
            return false;
          }
          // Externalize non-workspace node_modules
          if (!id.startsWith('.') && !id.startsWith('/')) {
            return true;
          }
          return false;
        },
      },
    },
    ssr: {
      noExternal: [], // Keep all dependencies external for Node.js
    },
  };
});
