import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  const defaults = {
    VITE_API: '/api',
  };

  const getEnv = (key) => {
    return env[key] || defaults[key] || '';
  };

  // Per-clone overrides (secondary working copy sets these in a git-ignored
  // apps/web/.env.local). Defaults keep the primary clone on 5173 / :3001.
  const devPort = Number(getEnv('VITE_PORT')) || 5173;
  const hmrPort = Number(getEnv('VITE_HMR_PORT')) || 5174;
  const proxyTarget = getEnv('VITE_PROXY_TARGET') || 'http://localhost:3001';

  return {
    root: __dirname,
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
    ],
    server: {
      port: devPort,
      host: true,
      hmr: {
        port: hmrPort,
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        // Proxy only concrete media asset fetches (e.g. /media/:mediaId/:variant)
        // so SPA routes like /media keep resolving to index.html on refresh.
        '^/media/[^/]+/[^/]+$': {
          target: proxyTarget,
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
