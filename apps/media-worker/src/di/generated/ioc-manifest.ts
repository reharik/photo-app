/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_______packages_context_media_core_src_repositories_domainRepositories_albumRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_repositories_domainRepositories_commentRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_repositories_domainRepositories_mediaItemRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_repositories_domainRepositories_notificationRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_repositories_domainRepositories_shareLinkRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_repositories_domainRepositories_userRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_repositories_readRepositories_albumReadRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_repositories_readRepositories_mediaAssetReadRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_repositories_readRepositories_mediaItemReadRepository from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_readServices_viewerReadServices_viewerAlbumReadService from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_readServices_viewerReadServices_viewerMediaItemReadService from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_album_addAlbumItem from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_album_addMediaItemsToAlbum from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_album_createAlbum from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_album_deleteAlbum from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_album_deleteAlbumItems from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_album_reorderAlbumItems from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_album_setCoverMedia from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_album_unsetCoverMedia from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_mediaItem_createMediaItemUpload from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_mediaItem_deleteMediaItem from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_mediaItem_deleteMediaItems from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_mediaItem_finalizeMediaItemUpload from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_mediaItem_updateMediaItem from '@packages/media-core';
import * as ioc_______packages_context_media_core_src_services_writeServices_mediaItem_updateMediaItemTags from '@packages/media-core';
import * as ioc_src_application_processNextMediaDeletionJob from '../../application/processNextMediaDeletionJob.js';
import * as ioc_src_application_processNextMediaImageJob from '../../application/processNextMediaImageJob.js';
import * as ioc_src_config from '../../config.js';
import * as ioc_src_infrastructure_logger_logger from '../../infrastructure/logger/logger.js';
import * as ioc_src_infrastructure_media_mediaStorage from '../../infrastructure/media/mediaStorage.js';
import * as ioc_src_knex from '../../knex.js';
import * as ioc_src_knexfile from '../../knexfile.js';
import * as ioc_src_repositories_domainRepositories_mediaDeletionJobRepository from '../../repositories/domainRepositories/mediaDeletionJobRepository.js';
import * as ioc_src_repositories_domainRepositories_mediaProcessingJobRepository from '../../repositories/domainRepositories/mediaProcessingJobRepository.js';
import * as ioc_src_runMediaWorkerLoop from '../../runMediaWorkerLoop.js';

type IocManifestGroupRoots = {
  readonly readServiceFactories: {
    readonly viewerAlbumReadServiceFactory: {
      readonly contractName: 'ViewerAlbumReadServiceFactory';
      readonly registrationKey: 'viewerAlbumReadServiceFactory';
    };
    readonly viewerMediaItemReadServiceFactory: {
      readonly contractName: 'ViewerMediaItemReadServiceFactory';
      readonly registrationKey: 'viewerMediaItemReadServiceFactory';
    };
  };
  readonly writeServices: {
    readonly addAlbumItem: {
      readonly contractName: 'AddAlbumItem';
      readonly registrationKey: 'addAlbumItem';
    };
    readonly addMediaItemsToAlbum: {
      readonly contractName: 'AddMediaItemsToAlbum';
      readonly registrationKey: 'addMediaItemsToAlbum';
    };
    readonly createAlbum: {
      readonly contractName: 'CreateAlbum';
      readonly registrationKey: 'createAlbum';
    };
    readonly createMediaUpload: {
      readonly contractName: 'CreateMediaUpload';
      readonly registrationKey: 'createMediaItemUpload';
    };
    readonly deleteAlbum: {
      readonly contractName: 'DeleteAlbum';
      readonly registrationKey: 'deleteAlbum';
    };
    readonly deleteAlbumItems: {
      readonly contractName: 'DeleteAlbumItems';
      readonly registrationKey: 'deleteAlbumItems';
    };
    readonly deleteMediaItem: {
      readonly contractName: 'DeleteMediaItem';
      readonly registrationKey: 'deleteMediaItem';
    };
    readonly deleteMediaItems: {
      readonly contractName: 'DeleteMediaItems';
      readonly registrationKey: 'deleteMediaItems';
    };
    readonly finalizeMediaItemUpload: {
      readonly contractName: 'FinalizeMediaItemUpload';
      readonly registrationKey: 'finalizeMediaItemUpload';
    };
    readonly reorderAlbumItems: {
      readonly contractName: 'ReorderAlbumItems';
      readonly registrationKey: 'reorderAlbumItems';
    };
    readonly setCoverMedia: {
      readonly contractName: 'SetCoverMedia';
      readonly registrationKey: 'setCoverMedia';
    };
    readonly unsetCoverMedia: {
      readonly contractName: 'UnsetCoverMedia';
      readonly registrationKey: 'unsetCoverMedia';
    };
    readonly updateMediaItem: {
      readonly contractName: 'UpdateMediaItem';
      readonly registrationKey: 'updateMediaItem';
    };
    readonly updateMediaItemTags: {
      readonly contractName: 'UpdateMediaItemTags';
      readonly registrationKey: 'updateMediaItemTags';
    };
  };
};

export const iocManifest = {
  moduleImports: [
    ioc_______packages_context_media_core_src_repositories_domainRepositories_albumRepository,
    ioc_______packages_context_media_core_src_repositories_domainRepositories_commentRepository,
    ioc_______packages_context_media_core_src_repositories_domainRepositories_mediaItemRepository,
    ioc_______packages_context_media_core_src_repositories_domainRepositories_notificationRepository,
    ioc_______packages_context_media_core_src_repositories_domainRepositories_shareLinkRepository,
    ioc_______packages_context_media_core_src_repositories_domainRepositories_userRepository,
    ioc_______packages_context_media_core_src_repositories_readRepositories_albumReadRepository,
    ioc_______packages_context_media_core_src_repositories_readRepositories_mediaAssetReadRepository,
    ioc_______packages_context_media_core_src_repositories_readRepositories_mediaItemReadRepository,
    ioc_______packages_context_media_core_src_services_readServices_viewerReadServices_viewerAlbumReadService,
    ioc_______packages_context_media_core_src_services_readServices_viewerReadServices_viewerMediaItemReadService,
    ioc_______packages_context_media_core_src_services_writeServices_album_addAlbumItem,
    ioc_______packages_context_media_core_src_services_writeServices_album_addMediaItemsToAlbum,
    ioc_______packages_context_media_core_src_services_writeServices_album_createAlbum,
    ioc_______packages_context_media_core_src_services_writeServices_album_deleteAlbum,
    ioc_______packages_context_media_core_src_services_writeServices_album_deleteAlbumItems,
    ioc_______packages_context_media_core_src_services_writeServices_album_reorderAlbumItems,
    ioc_______packages_context_media_core_src_services_writeServices_album_setCoverMedia,
    ioc_______packages_context_media_core_src_services_writeServices_album_unsetCoverMedia,
    ioc_______packages_context_media_core_src_services_writeServices_mediaItem_createMediaItemUpload,
    ioc_______packages_context_media_core_src_services_writeServices_mediaItem_deleteMediaItem,
    ioc_______packages_context_media_core_src_services_writeServices_mediaItem_deleteMediaItems,
    ioc_______packages_context_media_core_src_services_writeServices_mediaItem_finalizeMediaItemUpload,
    ioc_______packages_context_media_core_src_services_writeServices_mediaItem_updateMediaItem,
    ioc_______packages_context_media_core_src_services_writeServices_mediaItem_updateMediaItemTags,
    ioc_src_application_processNextMediaDeletionJob,
    ioc_src_application_processNextMediaImageJob,
    ioc_src_config,
    ioc_src_infrastructure_logger_logger,
    ioc_src_infrastructure_media_mediaStorage,
    ioc_src_knex,
    ioc_src_knexfile,
    ioc_src_repositories_domainRepositories_mediaDeletionJobRepository,
    ioc_src_repositories_domainRepositories_mediaProcessingJobRepository,
    ioc_src_runMediaWorkerLoop,
  ] as const satisfies readonly IocModuleNamespace[],

  contracts: {
    AddAlbumItem: {
      addAlbumItem: {
        exportName: 'buildAddAlbumItem',
        registrationKey: 'addAlbumItem',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/album/addAlbumItem.ts',
        relImport: '@packages/media-core',
        contractName: 'AddAlbumItem',
        implementationName: 'addAlbumItem',
        lifetime: 'singleton',
        moduleIndex: 11,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'MediaItemReadRepository'],
      },
    },
    AddMediaItemsToAlbum: {
      addMediaItemsToAlbum: {
        exportName: 'buildAddMediaItemsToAlbum',
        registrationKey: 'addMediaItemsToAlbum',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/album/addMediaItemsToAlbum.ts',
        relImport: '@packages/media-core',
        contractName: 'AddMediaItemsToAlbum',
        implementationName: 'addMediaItemsToAlbum',
        lifetime: 'singleton',
        moduleIndex: 12,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'MediaItemReadRepository'],
      },
    },
    AlbumReadRepository: {
      albumReadRepository: {
        exportName: 'buildAlbumReadRepository',
        registrationKey: 'albumReadRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/readRepositories/albumReadRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'AlbumReadRepository',
        implementationName: 'albumReadRepository',
        lifetime: 'scoped',
        moduleIndex: 6,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['Knex'],
      },
    },
    AlbumRepository: {
      albumRepository: {
        exportName: 'buildAlbumRepository',
        registrationKey: 'albumRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/domainRepositories/albumRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'AlbumRepository',
        implementationName: 'albumRepository',
        lifetime: 'singleton',
        moduleIndex: 0,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Knex'],
      },
    },
    CommentRepository: {
      commentRepository: {
        exportName: 'buildCommentRepository',
        registrationKey: 'commentRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/domainRepositories/commentRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'CommentRepository',
        implementationName: 'commentRepository',
        lifetime: 'singleton',
        moduleIndex: 1,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Knex'],
      },
    },
    Config: {
      config: {
        exportName: 'buildConfig',
        registrationKey: 'config',
        modulePath: 'src/config.ts',
        relImport: '../../config.js',
        contractName: 'Config',
        implementationName: 'config',
        lifetime: 'singleton',
        moduleIndex: 27,
        default: true,
        discoveredBy: 'naming',
      },
    },
    CreateAlbum: {
      createAlbum: {
        exportName: 'buildCreateAlbum',
        registrationKey: 'createAlbum',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/album/createAlbum.ts',
        relImport: '@packages/media-core',
        contractName: 'CreateAlbum',
        implementationName: 'createAlbum',
        lifetime: 'singleton',
        moduleIndex: 13,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    CreateMediaUpload: {
      createMediaItemUpload: {
        exportName: 'buildCreateMediaItemUpload',
        registrationKey: 'createMediaItemUpload',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/mediaItem/createMediaItemUpload.ts',
        relImport: '@packages/media-core',
        contractName: 'CreateMediaUpload',
        implementationName: 'createMediaItemUpload',
        lifetime: 'singleton',
        moduleIndex: 19,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['MediaItemRepository', 'MediaStorage'],
      },
    },
    DeleteAlbum: {
      deleteAlbum: {
        exportName: 'buildDeleteAlbum',
        registrationKey: 'deleteAlbum',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/album/deleteAlbum.ts',
        relImport: '@packages/media-core',
        contractName: 'DeleteAlbum',
        implementationName: 'deleteAlbum',
        lifetime: 'singleton',
        moduleIndex: 14,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    DeleteAlbumItems: {
      deleteAlbumItems: {
        exportName: 'buildDeleteAlbumItems',
        registrationKey: 'deleteAlbumItems',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/album/deleteAlbumItems.ts',
        relImport: '@packages/media-core',
        contractName: 'DeleteAlbumItems',
        implementationName: 'deleteAlbumItems',
        lifetime: 'singleton',
        moduleIndex: 15,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    DeleteMediaItem: {
      deleteMediaItem: {
        exportName: 'buildDeleteMediaItem',
        registrationKey: 'deleteMediaItem',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/mediaItem/deleteMediaItem.ts',
        relImport: '@packages/media-core',
        contractName: 'DeleteMediaItem',
        implementationName: 'deleteMediaItem',
        lifetime: 'singleton',
        moduleIndex: 20,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumReadRepository',
          'AlbumRepository',
          'Knex',
          'MediaItemRepository',
        ],
      },
    },
    DeleteMediaItems: {
      deleteMediaItems: {
        exportName: 'buildDeleteMediaItems',
        registrationKey: 'deleteMediaItems',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/mediaItem/deleteMediaItems.ts',
        relImport: '@packages/media-core',
        contractName: 'DeleteMediaItems',
        implementationName: 'deleteMediaItems',
        lifetime: 'singleton',
        moduleIndex: 21,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumReadRepository',
          'AlbumRepository',
          'Knex',
          'MediaItemReadRepository',
          'MediaItemRepository',
        ],
      },
    },
    FinalizeMediaItemUpload: {
      finalizeMediaItemUpload: {
        exportName: 'buildFinalizeMediaItemUpload',
        registrationKey: 'finalizeMediaItemUpload',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/mediaItem/finalizeMediaItemUpload.ts',
        relImport: '@packages/media-core',
        contractName: 'FinalizeMediaItemUpload',
        implementationName: 'finalizeMediaItemUpload',
        lifetime: 'singleton',
        moduleIndex: 22,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'MediaItemRepository',
          'MediaProcessingJobRepository',
          'MediaStorage',
        ],
      },
    },
    Knex: {
      database: {
        exportName: 'buildDatabase',
        registrationKey: 'database',
        modulePath: 'src/knex.ts',
        relImport: '../../knex.js',
        contractName: 'Knex',
        implementationName: 'database',
        lifetime: 'singleton',
        moduleIndex: 30,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['accessKey'],
        dependencyContractNames: ['KnexConfig'],
        accessKey: 'database',
      },
    },
    KnexConfig: {
      knexConfig: {
        exportName: 'buildKnexConfig',
        registrationKey: 'knexConfig',
        modulePath: 'src/knexfile.ts',
        relImport: '../../knexfile.js',
        contractName: 'KnexConfig',
        implementationName: 'knexConfig',
        lifetime: 'singleton',
        moduleIndex: 31,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    Logger: {
      logger: {
        exportName: 'buildLogger',
        registrationKey: 'logger',
        modulePath: 'src/infrastructure/logger/logger.ts',
        relImport: '../../infrastructure/logger/logger.js',
        contractName: 'Logger',
        implementationName: 'logger',
        lifetime: 'singleton',
        moduleIndex: 28,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    MediaAssetReadRepository: {
      mediaAssetReadRepository: {
        exportName: 'buildMediaAssetReadRepository',
        registrationKey: 'mediaAssetReadRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/readRepositories/mediaAssetReadRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'MediaAssetReadRepository',
        implementationName: 'mediaAssetReadRepository',
        lifetime: 'scoped',
        moduleIndex: 7,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['Knex'],
      },
    },
    MediaDeletionJobRepository: {
      mediaDeletionJobRepository: {
        exportName: 'buildMediaDeletionJobRepository',
        registrationKey: 'mediaDeletionJobRepository',
        modulePath: 'src/repositories/domainRepositories/mediaDeletionJobRepository.ts',
        relImport: '../../repositories/domainRepositories/mediaDeletionJobRepository.js',
        contractName: 'MediaDeletionJobRepository',
        implementationName: 'mediaDeletionJobRepository',
        lifetime: 'scoped',
        moduleIndex: 32,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['Knex'],
      },
    },
    MediaItemReadRepository: {
      mediaItemReadRepository: {
        exportName: 'buildMediaItemReadRepository',
        registrationKey: 'mediaItemReadRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/readRepositories/mediaItemReadRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'MediaItemReadRepository',
        implementationName: 'mediaItemReadRepository',
        lifetime: 'scoped',
        moduleIndex: 8,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['Knex'],
      },
    },
    MediaItemRepository: {
      mediaItemRepository: {
        exportName: 'buildMediaItemRepository',
        registrationKey: 'mediaItemRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/domainRepositories/mediaItemRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'MediaItemRepository',
        implementationName: 'mediaItemRepository',
        lifetime: 'singleton',
        moduleIndex: 2,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Knex'],
      },
    },
    MediaProcessingJobRepository: {
      mediaProcessingJobRepository: {
        exportName: 'buildMediaProcessingJobRepository',
        registrationKey: 'mediaProcessingJobRepository',
        modulePath: 'src/repositories/domainRepositories/mediaProcessingJobRepository.ts',
        relImport: '../../repositories/domainRepositories/mediaProcessingJobRepository.js',
        contractName: 'MediaProcessingJobRepository',
        implementationName: 'mediaProcessingJobRepository',
        lifetime: 'scoped',
        moduleIndex: 33,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['Knex'],
      },
    },
    MediaStorage: {
      mediaStorage: {
        exportName: 'buildMediaStorage',
        registrationKey: 'mediaStorage',
        modulePath: 'src/infrastructure/media/mediaStorage.ts',
        relImport: '../../infrastructure/media/mediaStorage.js',
        contractName: 'MediaStorage',
        implementationName: 'mediaStorage',
        lifetime: 'singleton',
        moduleIndex: 29,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    NotificationRepository: {
      notificationRepository: {
        exportName: 'buildNotificationRepository',
        registrationKey: 'notificationRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/domainRepositories/notificationRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'NotificationRepository',
        implementationName: 'notificationRepository',
        lifetime: 'singleton',
        moduleIndex: 3,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Knex'],
      },
    },
    ProcessNextMediaDeletionJob: {
      processNextMediaDeletionJob: {
        exportName: 'buildProcessNextMediaDeletionJob',
        registrationKey: 'processNextMediaDeletionJob',
        modulePath: 'src/application/processNextMediaDeletionJob.ts',
        relImport: '../../application/processNextMediaDeletionJob.js',
        contractName: 'ProcessNextMediaDeletionJob',
        implementationName: 'processNextMediaDeletionJob',
        lifetime: 'singleton',
        moduleIndex: 25,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'Logger',
          'MediaDeletionJobRepository',
          'MediaItemRepository',
          'MediaStorage',
        ],
      },
    },
    ProcessNextMediaImageJob: {
      processNextMediaImageJob: {
        exportName: 'buildProcessNextMediaImageJob',
        registrationKey: 'processNextMediaImageJob',
        modulePath: 'src/application/processNextMediaImageJob.ts',
        relImport: '../../application/processNextMediaImageJob.js',
        contractName: 'ProcessNextMediaImageJob',
        implementationName: 'processNextMediaImageJob',
        lifetime: 'singleton',
        moduleIndex: 26,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'Config',
          'Logger',
          'MediaItemRepository',
          'MediaProcessingJobRepository',
          'MediaStorage',
        ],
      },
    },
    ReorderAlbumItems: {
      reorderAlbumItems: {
        exportName: 'buildReorderAlbumItems',
        registrationKey: 'reorderAlbumItems',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/album/reorderAlbumItems.ts',
        relImport: '@packages/media-core',
        contractName: 'ReorderAlbumItems',
        implementationName: 'reorderAlbumItems',
        lifetime: 'singleton',
        moduleIndex: 16,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    RunMediaWorkerLoop: {
      runMediaWorkerLoop: {
        exportName: 'buildRunMediaWorkerLoop',
        registrationKey: 'runMediaWorkerLoop',
        modulePath: 'src/runMediaWorkerLoop.ts',
        relImport: '../../runMediaWorkerLoop.js',
        contractName: 'RunMediaWorkerLoop',
        implementationName: 'runMediaWorkerLoop',
        lifetime: 'singleton',
        moduleIndex: 34,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'Config',
          'Logger',
          'ProcessNextMediaDeletionJob',
          'ProcessNextMediaImageJob',
        ],
      },
    },
    SetCoverMedia: {
      setCoverMedia: {
        exportName: 'buildSetCoverMedia',
        registrationKey: 'setCoverMedia',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/album/setCoverMedia.ts',
        relImport: '@packages/media-core',
        contractName: 'SetCoverMedia',
        implementationName: 'setCoverMedia',
        lifetime: 'singleton',
        moduleIndex: 17,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'MediaItemReadRepository'],
      },
    },
    ShareLinkRepository: {
      shareLinkRepository: {
        exportName: 'buildShareLinkRepository',
        registrationKey: 'shareLinkRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/domainRepositories/shareLinkRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'ShareLinkRepository',
        implementationName: 'shareLinkRepository',
        lifetime: 'singleton',
        moduleIndex: 4,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Knex'],
      },
    },
    UnsetCoverMedia: {
      unsetCoverMedia: {
        exportName: 'buildUnsetCoverMedia',
        registrationKey: 'unsetCoverMedia',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/album/unsetCoverMedia.ts',
        relImport: '@packages/media-core',
        contractName: 'UnsetCoverMedia',
        implementationName: 'unsetCoverMedia',
        lifetime: 'singleton',
        moduleIndex: 18,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    UpdateMediaItem: {
      updateMediaItem: {
        exportName: 'buildUpdateMediaItem',
        registrationKey: 'updateMediaItem',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/mediaItem/updateMediaItem.ts',
        relImport: '@packages/media-core',
        contractName: 'UpdateMediaItem',
        implementationName: 'updateMediaItem',
        lifetime: 'singleton',
        moduleIndex: 23,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['MediaItemRepository'],
      },
    },
    UpdateMediaItemTags: {
      updateMediaItemTags: {
        exportName: 'buildUpdateMediaItemTags',
        registrationKey: 'updateMediaItemTags',
        modulePath:
          '../../packages/context/media-core/src/services/writeServices/mediaItem/updateMediaItemTags.ts',
        relImport: '@packages/media-core',
        contractName: 'UpdateMediaItemTags',
        implementationName: 'updateMediaItemTags',
        lifetime: 'singleton',
        moduleIndex: 24,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['MediaItemRepository'],
      },
    },
    UserRepository: {
      userRepository: {
        exportName: 'buildUserRepository',
        registrationKey: 'userRepository',
        modulePath:
          '../../packages/context/media-core/src/repositories/domainRepositories/userRepository.ts',
        relImport: '@packages/media-core',
        contractName: 'UserRepository',
        implementationName: 'userRepository',
        lifetime: 'singleton',
        moduleIndex: 5,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Knex'],
      },
    },
    ViewerAlbumReadServiceFactory: {
      viewerAlbumReadServiceFactory: {
        exportName: 'buildViewerAlbumReadServiceFactory',
        registrationKey: 'viewerAlbumReadServiceFactory',
        modulePath:
          '../../packages/context/media-core/src/services/readServices/viewerReadServices/viewerAlbumReadService.ts',
        relImport: '@packages/media-core',
        contractName: 'ViewerAlbumReadServiceFactory',
        implementationName: 'viewerAlbumReadServiceFactory',
        lifetime: 'scoped',
        moduleIndex: 9,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['AlbumReadRepository', 'MediaItemReadRepository'],
      },
    },
    ViewerMediaItemReadServiceFactory: {
      viewerMediaItemReadServiceFactory: {
        exportName: 'buildViewerMediaItemReadServiceFactory',
        registrationKey: 'viewerMediaItemReadServiceFactory',
        modulePath:
          '../../packages/context/media-core/src/services/readServices/viewerReadServices/viewerMediaItemReadService.ts',
        relImport: '@packages/media-core',
        contractName: 'ViewerMediaItemReadServiceFactory',
        implementationName: 'viewerMediaItemReadServiceFactory',
        lifetime: 'scoped',
        moduleIndex: 10,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['MediaItemReadRepository', 'MediaStorage'],
      },
    },
  },
  // readServiceFactories
  readServiceFactories: {
    viewerAlbumReadServiceFactory: {
      contractName: 'ViewerAlbumReadServiceFactory',
      registrationKey: 'viewerAlbumReadServiceFactory',
    },
    viewerMediaItemReadServiceFactory: {
      contractName: 'ViewerMediaItemReadServiceFactory',
      registrationKey: 'viewerMediaItemReadServiceFactory',
    },
  },

  // writeServices
  writeServices: {
    addAlbumItem: {
      contractName: 'AddAlbumItem',
      registrationKey: 'addAlbumItem',
    },
    addMediaItemsToAlbum: {
      contractName: 'AddMediaItemsToAlbum',
      registrationKey: 'addMediaItemsToAlbum',
    },
    createAlbum: {
      contractName: 'CreateAlbum',
      registrationKey: 'createAlbum',
    },
    createMediaUpload: {
      contractName: 'CreateMediaUpload',
      registrationKey: 'createMediaItemUpload',
    },
    deleteAlbum: {
      contractName: 'DeleteAlbum',
      registrationKey: 'deleteAlbum',
    },
    deleteAlbumItems: {
      contractName: 'DeleteAlbumItems',
      registrationKey: 'deleteAlbumItems',
    },
    deleteMediaItem: {
      contractName: 'DeleteMediaItem',
      registrationKey: 'deleteMediaItem',
    },
    deleteMediaItems: {
      contractName: 'DeleteMediaItems',
      registrationKey: 'deleteMediaItems',
    },
    finalizeMediaItemUpload: {
      contractName: 'FinalizeMediaItemUpload',
      registrationKey: 'finalizeMediaItemUpload',
    },
    reorderAlbumItems: {
      contractName: 'ReorderAlbumItems',
      registrationKey: 'reorderAlbumItems',
    },
    setCoverMedia: {
      contractName: 'SetCoverMedia',
      registrationKey: 'setCoverMedia',
    },
    unsetCoverMedia: {
      contractName: 'UnsetCoverMedia',
      registrationKey: 'unsetCoverMedia',
    },
    updateMediaItem: {
      contractName: 'UpdateMediaItem',
      registrationKey: 'updateMediaItem',
    },
    updateMediaItemTags: {
      contractName: 'UpdateMediaItemTags',
      registrationKey: 'updateMediaItemTags',
    },
  },
} as const satisfies IocGeneratedContainerManifest<IocManifestGroupRoots>;
