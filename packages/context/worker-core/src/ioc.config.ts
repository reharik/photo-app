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
      'domain/**',
    ],
    factoryPrefix: 'build__',
  },
  registrations: {
    UnitOfWork: {
      // `uow` is the key every consumer demands. accessKey alone only buys a runtime
      // `aliasTo`; the generated cradle would still expose `unitOfWork` and every
      // consumer's `uow` would stay an unsatisfied external. `name` moves the
      // registration key itself, so the two coincide.
      //
      // Lifetime: singleton, like every repository and service in worker-core. Nothing
      // here extends RequestScopeLifeCycle, so the `lifetimeMarkers` entry below is
      // inert — and the worker never opens a child scope, so the uow is one
      // transaction slot for the whole process (see apps/media-worker/CLAUDE.md).
      $contract: { accessKey: 'uow' },
      unitOfWork: { name: 'uow' },
    },
  },
  lifetimeMarkers: {
    RequestScopeLifeCycle: 'scoped',
  },
});
