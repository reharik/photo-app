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
