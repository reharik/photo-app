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
    // RequestScopeLifeCycle: 'scoped',
    // WorkerJobProcessorBase: 'scoped',
  },

  registrations: {
    Knex: {
      $contract: { accessKey: 'database' },
    },
    EventPublisher: {
      noopEventPublisher: { name: 'noopEventPublisher', default: true },
    },
  },
  groups: {
    workerTasks: {
      // Nominal-heritage membership can't target the WorkerTask UNION; the shared
      // base is what every per-task contract interface transitively extends.
      kind: 'collection',
      baseType: 'WorkerTaskBase',
    },
    fastSweepNotificationStrategies: {
      kind: 'collection',
      baseType: 'FastSweepNotificationStrategy',
      baseTypeArg: 'TemplateName',
    },
    batchedEmailActivity: {
      kind: 'collection',
      baseType: 'BatchedEmailPayload',
    },
  },
});
