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
  registrations: {
    UnitOfWork: {
      $contract: { accessKey: 'unitOfWork' },
      unitOfWork: { lifetime: 'transient' },
    },
  },
  lifetimeMarkers: {
    RequestScopeLifeCycle: 'scoped',
  },
  scopeProvided: ['viewerId', 'publicLinkId', 'uow'],
  groups: {
    publicReadServices: {
      kind: 'object',
      baseType: 'PublicReadServiceBase',
    },
    readServices: {
      kind: 'object',
      baseType: 'ReadServiceBase',
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
