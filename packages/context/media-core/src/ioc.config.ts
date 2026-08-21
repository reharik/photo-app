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
      // `uow` is the key every consumer demands. It used to be an explicit transient
      // hand-registered onto each child scope (beginUnitOfWorkScope's asValue), which is
      // why the contract was exposed under a second name. Scope roots open the scope now,
      // so the uow is an ordinary scoped sibling: one per scope, resolved like any other
      // dep. Lifetime is left to the RequestScopeLifeCycle heritage marker → scoped.
      // accessKey alone only buys a runtime `aliasTo`; the generated cradle would still
      // expose `unitOfWork` and every consumer's `uow` would stay an unsatisfied external.
      // `name` moves the registration key itself, so the two coincide.
      $contract: { accessKey: 'uow' },
      unitOfWork: { name: 'uow' },
    },
  },
  lifetimeMarkers: {
    RequestScopeLifeCycle: 'scoped',
  },
  scopeProvided: ['viewerId', 'publicLinkId'],
  groups: {
    domainEventHandlers: {
      kind: 'collection',
      baseType: 'DomainEventHandler',
      baseTypeArg: 'DomainEventKind',
    },
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
    notificationWriters: {
      kind: 'object',
      baseType: 'NotificationWriter',
    },
    notificationStrategies: {
      kind: 'collection',
      baseType: 'NotificationStrategy',
      baseTypeArg: 'DomainEventKind',
    },
  },
});
