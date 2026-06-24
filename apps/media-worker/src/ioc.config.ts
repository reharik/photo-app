import { defineIocConfig } from 'ioc-manifest';

export default defineIocConfig({
  discovery: {
    scanDirs: 'src',
    generatedDir: 'src/generated',
    includes: ['**/*.{ts,tsx}'],
    excludes: [
      '**/*.d.ts',
      '**/*.{test,tests}.{ts,tsx}',
      '!**/{test,tests}/**',
      '**/*.spec.{ts,tsx}',
      'generated/**',
      'dist/**',
      '**/dist/**',
      '**/node_modules/**',
    ],
    factoryPrefix: 'build__',
  },
  composedManifests: ['@packages/media-core', '@packages/infrastructure'],
  lifetimeMarkers: {
    RequestScopeLifeCycle: 'scoped',
    WorkerJobProcessorBase: 'scoped',
  },
  registrations: {
    Knex: {
      $contract: { accessKey: 'database' },
    },
  },
});
