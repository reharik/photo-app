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
  composedManifests: [
    '@packages/media-core',
    '@packages/infrastructure',
    '@packages/notifications',
  ],
  lifetimeMarkers: {
    RequestScopeLifeCycle: 'scoped',
    WorkerJobProcessorBase: 'scoped',
  },
  registrations: {
    Knex: {
      $contract: { accessKey: 'database' },
    },
    WorkerTask: {
      notificationBatchTask: { default: true }, // this is just so I can reuse the interface then group
    },
  },
  groups: {
    workerTasks: {
      kind: 'collection',
      baseType: 'WorkerTask',
    },
  },
});
