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
    factoryPrefix: 'build',
    workspacePackageImportBases: [
      {
        root: 'packages/foundation/infrastructure/src',
        importBase: '@packages/infrastructure',
      },
    ],
  },
  registrations: {
    MediaItemReadRepository: {
      mediaItemReadRepository: { lifetime: 'scoped' },
    },
    MediaAssetReadRepository: {
      mediaAssetReadRepository: { lifetime: 'scoped' },
    },
    MediaProcessingJobRepository: {
      mediaProcessingJobRepository: { lifetime: 'scoped' },
    },
    ViewerMediaItemReadServiceFactory: {
      viewerMediaItemReadServiceFactory: { lifetime: 'scoped' },
    },
    AlbumReadRepository: {
      albumReadRepository: { lifetime: 'scoped' },
    },
    ViewerAlbumReadServiceFactory: {
      viewerAlbumReadServiceFactory: { lifetime: 'scoped' },
    },
    ShareReadRepository: {
      shareReadRepository: { lifetime: 'scoped' },
    },
    SharedWithMeReadRepository: {
      sharedWithMeReadRepository: { lifetime: 'scoped' },
    },
    ShareContactRepository: {
      shareContactRepository: { lifetime: 'scoped' },
    },
    ViewerShareReadServiceFactory: {
      viewerShareReadServiceFactory: { lifetime: 'scoped' },
    },
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
    readServiceFactories: {
      kind: 'object',
      baseType: 'ReadServiceFactoryBase',
    },
    writeServices: {
      kind: 'object',
      baseType: 'WriteServiceBase',
    },
  },
});
