import { defineIocConfig } from 'ioc-manifest';

export default defineIocConfig({
  discovery: {
    scanDirs: 'src',
    generatedDir: 'src/di/generated',
    includes: ['**/*.{ts,tsx}'],
    excludes: [
      '**/*.d.ts',
      '**/*.{test,tests}.{ts,tsx}',
      '!**/{test,tests}/**',
      '**/*.spec.{ts,tsx}',
      'di/generated/**',
      'dist/**',
      '**/dist/**',
      '**/node_modules/**',
    ],
    factoryPrefix: 'build__',
  },
  composedManifests: [
    '@packages/media-core',
    '@packages/infrastructure',
    '@packages/notifications',
  ],
  lifetimeMarkers: {
    RequestScopeLifeCycle: 'scoped',
  },
  registrations: {
    Knex: {
      $contract: { accessKey: 'database' },
    },
    AuthMiddleware: {
      // Keep strict middleware under a distinct key so `authMiddleware` (contract default slot) aliases to optional.
      authMiddleware: { name: 'strictAuthMiddleware' },
      optionalAuthMiddleware: { default: true },
    },
  },
});
