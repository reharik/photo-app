import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the web directory
  const env = loadEnv(mode, __dirname, '');

  // Default values for development
  const defaults = {
    VITE_API: 'http://localhost:3001/api',
  };

  // Use env vars if available, otherwise fall back to defaults
  const getEnv = (key) => {
    return env[key] || defaults[key] || '';
  };

  return {
    root: __dirname, // web
    cacheDir: '../node_modules/.vite/web',
    plugins: [
      react({
        fastRefresh: true,
        babel: {
          plugins: [
            [
              'babel-plugin-styled-components',
              {
                displayName: true,
                fileName: true,
              },
            ],
          ],
        },
      }),
      tsconfigPaths(),
    ],
    server: {
      port: 5173,
      host: 'localhost',
      hmr: {
        port: 5174,
      },
      proxy: {
        // Proxy only concrete media asset fetches (e.g. /media/:mediaId/:variant)
        // so SPA routes like /media keep resolving to index.html on refresh.
        '^/media/[^/]+/[^/]+$': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'import.meta.env.VITE_API': JSON.stringify(getEnv('VITE_API')),
    },
  };
});
