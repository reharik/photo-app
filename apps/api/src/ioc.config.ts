import { defineIocConfig } from 'ioc-manifest';

export default defineIocConfig({
  discovery: {
    scanDirs: [
      { path: 'src', importMode: 'subpath' },
      {
        path: '../../packages/context/media-core',
        importPrefix: '@packages/media-core',
        importMode: 'root',
      },
    ],
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
    workspacePackageImportBases: [
      {
        root: 'packages/foundation/infrastructure/src',
        importBase: '@packages/infrastructure',
      },
    ],
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
  groups: {
    publicReadServiceFactories: {
      kind: 'object',
      baseType: 'PublicReadServiceFactoryBase',
    },
    readServiceFactories: {
      kind: 'object',
      baseType: 'ReadServiceFactoryBase',
    },
    writeServices: {
      kind: 'object',
      baseType: 'WriteServiceBase',
    },
    agnosticReadServices: {
      kind: 'object',
      baseType: 'AgnosticReadServiceBase',
    },
  },
});
