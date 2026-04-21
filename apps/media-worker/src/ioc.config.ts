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
    MediaDeletionJobRepository: {
      mediaDeletionJobRepository: { lifetime: 'scoped' },
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
    Knex: {
      $contract: { accessKey: 'database' },
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
