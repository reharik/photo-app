/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_application_media_s3MediaStorage from '../application/media/s3MediaStorage.js';
import * as ioc_infrastructure_repositories_runInTransaction from '../infrastructure/repositories/runInTransaction.js';
import * as ioc_repositories_domainRepositories_albumRepository from '../repositories/domainRepositories/albumRepository.js';
import * as ioc_repositories_domainRepositories_commentRepository from '../repositories/domainRepositories/commentRepository.js';
import * as ioc_repositories_domainRepositories_grantRepository from '../repositories/domainRepositories/grantRepository.js';
import * as ioc_repositories_domainRepositories_mediaItemRepository from '../repositories/domainRepositories/mediaItemRepository.js';
import * as ioc_repositories_domainRepositories_notificationRepository from '../repositories/domainRepositories/notificationRepository.js';
import * as ioc_repositories_domainRepositories_reactionRepository from '../repositories/domainRepositories/reactionRepository.js';
import * as ioc_repositories_domainRepositories_userRepository from '../repositories/domainRepositories/userRepository.js';
import * as ioc_repositories_readRepositories_albumMemberReadRepository from '../repositories/readRepositories/albumMemberReadRepository.js';
import * as ioc_repositories_readRepositories_albumReadRepository from '../repositories/readRepositories/albumReadRepository.js';
import * as ioc_repositories_readRepositories_authorizationReadRepository from '../repositories/readRepositories/authorizationReadRepository.js';
import * as ioc_repositories_readRepositories_commentReadRepository from '../repositories/readRepositories/commentReadRepository.js';
import * as ioc_repositories_readRepositories_grantReadRepository from '../repositories/readRepositories/grantReadRepository.js';
import * as ioc_repositories_readRepositories_mediaItemReadRepository from '../repositories/readRepositories/mediaItemReadRepository.js';
import * as ioc_repositories_readRepositories_publicAccessReadRepository from '../repositories/readRepositories/publicAccessReadRepository.js';
import * as ioc_repositories_readRepositories_publicMediaItemReadRepository from '../repositories/readRepositories/publicMediaItemReadRepository.js';
import * as ioc_repositories_readRepositories_reactionReadRepository from '../repositories/readRepositories/reactionReadRepository.js';
import * as ioc_repositories_readRepositories_shareContactRepository from '../repositories/readRepositories/shareContactRepository.js';
import * as ioc_repositories_readRepositories_sharedWithMeReadRepository from '../repositories/readRepositories/sharedWithMeReadRepository.js';
import * as ioc_repositories_readRepositories_userReadRepository from '../repositories/readRepositories/userReadRepository.js';
import * as ioc_services_readServices_comments_commentReadService from '../services/readServices/comments/commentReadService.js';
import * as ioc_services_readServices_mediaGrantService from '../services/readServices/mediaGrantService.js';
import * as ioc_services_readServices_MediaItemOperationsService from '../services/readServices/MediaItemOperationsService.js';
import * as ioc_services_readServices_publicReadServices_publicAccessReadService from '../services/readServices/publicReadServices/publicAccessReadService.js';
import * as ioc_services_readServices_publicReadServices_publicAlbumReadService from '../services/readServices/publicReadServices/publicAlbumReadService.js';
import * as ioc_services_readServices_publicReadServices_publicMediaItemReadService from '../services/readServices/publicReadServices/publicMediaItemReadService.js';
import * as ioc_services_readServices_readReactionService from '../services/readServices/readReactionService.js';
import * as ioc_services_readServices_viewerReadServices_enrichMediaItems from '../services/readServices/viewerReadServices/enrichMediaItems.js';
import * as ioc_services_readServices_viewerReadServices_viewerAlbumReadService from '../services/readServices/viewerReadServices/viewerAlbumReadService.js';
import * as ioc_services_readServices_viewerReadServices_viewerAuthorizationsReadService from '../services/readServices/viewerReadServices/viewerAuthorizationsReadService.js';
import * as ioc_services_readServices_viewerReadServices_viewerMediaItemReadService from '../services/readServices/viewerReadServices/viewerMediaItemReadService.js';
import * as ioc_services_readServices_viewerReadServices_viewerReactionReadService from '../services/readServices/viewerReadServices/viewerReactionReadService.js';
import * as ioc_services_readServices_viewerReadServices_viewerSharedContactsReadService from '../services/readServices/viewerReadServices/viewerSharedContactsReadService.js';
import * as ioc_services_readServices_viewerReadServices_viewerSharedWithMeMediaItemReadService from '../services/readServices/viewerReadServices/viewerSharedWithMeMediaItemReadService.js';
import * as ioc_services_writeServices_album_addAlbumItem from '../services/writeServices/album/addAlbumItem.js';
import * as ioc_services_writeServices_album_addMediaItemsToAlbum from '../services/writeServices/album/addMediaItemsToAlbum.js';
import * as ioc_services_writeServices_album_createAlbum from '../services/writeServices/album/createAlbum.js';
import * as ioc_services_writeServices_album_deleteAlbum from '../services/writeServices/album/deleteAlbum.js';
import * as ioc_services_writeServices_album_deleteAlbumItems from '../services/writeServices/album/deleteAlbumItems.js';
import * as ioc_services_writeServices_album_reorderAlbumItems from '../services/writeServices/album/reorderAlbumItems.js';
import * as ioc_services_writeServices_album_setCoverMedia from '../services/writeServices/album/setCoverMedia.js';
import * as ioc_services_writeServices_album_unsetCoverMedia from '../services/writeServices/album/unsetCoverMedia.js';
import * as ioc_services_writeServices_authorization_grantAuthorizationForAlbum from '../services/writeServices/authorization/grantAuthorizationForAlbum.js';
import * as ioc_services_writeServices_authorization_grantAuthorizationForMediaItems from '../services/writeServices/authorization/grantAuthorizationForMediaItems.js';
import * as ioc_services_writeServices_comments_addComment from '../services/writeServices/comments/addComment.js';
import * as ioc_services_writeServices_comments_deleteComment from '../services/writeServices/comments/deleteComment.js';
import * as ioc_services_writeServices_comments_editComment from '../services/writeServices/comments/editComment.js';
import * as ioc_services_writeServices_mediaItem_createMediaItemUpload from '../services/writeServices/mediaItem/createMediaItemUpload.js';
import * as ioc_services_writeServices_mediaItem_deleteMediaItem from '../services/writeServices/mediaItem/deleteMediaItem.js';
import * as ioc_services_writeServices_mediaItem_deleteMediaItems from '../services/writeServices/mediaItem/deleteMediaItems.js';
import * as ioc_services_writeServices_mediaItem_finalizeMediaItemUpload from '../services/writeServices/mediaItem/finalizeMediaItemUpload.js';
import * as ioc_services_writeServices_mediaItem_updateMediaItem from '../services/writeServices/mediaItem/updateMediaItem.js';
import * as ioc_services_writeServices_mediaItem_updateMediaItemTags from '../services/writeServices/mediaItem/updateMediaItemTags.js';
import * as ioc_services_writeServices_publicLink_createPublicLinkForAlbum from '../services/writeServices/publicLink/createPublicLinkForAlbum.js';
import * as ioc_services_writeServices_publicLink_createPublicLinkForMediaItems from '../services/writeServices/publicLink/createPublicLinkForMediaItems.js';
import * as ioc_services_writeServices_reactions_addReaction from '../services/writeServices/reactions/addReaction.js';
import * as ioc_services_writeServices_reactions_removeReaction from '../services/writeServices/reactions/removeReaction.js';

type IocManifestGroupRoots = {
  readonly agnosticReadServices: {
    readonly kind: 'object';
    readonly baseType: 'AgnosticReadServiceBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:AgnosticReadServiceBase';
    readonly members: {
      readonly commentReadService: {
        readonly contractName: 'CommentReadService';
        readonly registrationKey: 'commentReadService';
      };
      readonly publicAccessReadService: {
        readonly contractName: 'PublicAccessReadService';
        readonly registrationKey: 'publicAccessReadService';
      };
    };
  };
  readonly publicReadServiceFactories: {
    readonly kind: 'object';
    readonly baseType: 'PublicReadServiceFactoryBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:PublicReadServiceFactoryBase';
    readonly members: {
      readonly publicAlbumReadServiceFactory: {
        readonly contractName: 'PublicAlbumReadServiceFactory';
        readonly registrationKey: 'publicAlbumReadServiceFactory';
      };
      readonly publicMediaItemReadServiceFactory: {
        readonly contractName: 'PublicMediaItemReadServiceFactory';
        readonly registrationKey: 'publicMediaItemReadServiceFactory';
      };
    };
  };
  readonly readServiceFactories: {
    readonly kind: 'object';
    readonly baseType: 'ReadServiceFactoryBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:ReadServiceFactoryBase';
    readonly members: {
      readonly viewerAlbumReadServiceFactory: {
        readonly contractName: 'ViewerAlbumReadServiceFactory';
        readonly registrationKey: 'viewerAlbumReadServiceFactory';
      };
      readonly viewerAuthorizationsReadServiceFactory: {
        readonly contractName: 'viewerAuthorizationsReadServiceFactory';
        readonly registrationKey: 'viewerAuthorizationsReadServiceFactory';
      };
      readonly viewerMediaItemReadServiceFactory: {
        readonly contractName: 'ViewerMediaItemReadServiceFactory';
        readonly registrationKey: 'viewerMediaItemReadServiceFactory';
      };
      readonly viewerReactionReadServiceFactory: {
        readonly contractName: 'ViewerReactionReadServiceFactory';
        readonly registrationKey: 'viewerReactionReadServiceFactory';
      };
      readonly viewerSharedContactsReadServiceFactory: {
        readonly contractName: 'ViewerSharedContactsReadServiceFactory';
        readonly registrationKey: 'viewerSharedContactsReadServiceFactory';
      };
      readonly viewerSharedWithMeMediaItemReadServiceFactory: {
        readonly contractName: 'ViewerSharedWithMeMediaItemReadServiceFactory';
        readonly registrationKey: 'viewerSharedWithMeMediaItemReadServiceFactory';
      };
    };
  };
  readonly writeServices: {
    readonly kind: 'object';
    readonly baseType: 'WriteServiceBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp/packages/context/media-core/src/services/writeServices/writeServiceBaseType.ts:WriteServiceBase';
    readonly members: {
      readonly addAlbumItem: {
        readonly contractName: 'AddAlbumItem';
        readonly registrationKey: 'addAlbumItem';
      };
      readonly addComment: {
        readonly contractName: 'AddComment';
        readonly registrationKey: 'addComment';
      };
      readonly addMediaItemsToAlbum: {
        readonly contractName: 'AddMediaItemsToAlbum';
        readonly registrationKey: 'addMediaItemsToAlbum';
      };
      readonly addReaction: {
        readonly contractName: 'AddReaction';
        readonly registrationKey: 'addReaction';
      };
      readonly createAlbum: {
        readonly contractName: 'CreateAlbum';
        readonly registrationKey: 'createAlbum';
      };
      readonly createMediaUpload: {
        readonly contractName: 'CreateMediaUpload';
        readonly registrationKey: 'createMediaItemUpload';
      };
      readonly createPublicLinkForAlbum: {
        readonly contractName: 'CreatePublicLinkForAlbum';
        readonly registrationKey: 'createPublicLinkForAlbum';
      };
      readonly createPublicLinkForMediaItems: {
        readonly contractName: 'CreatePublicLinkForMediaItems';
        readonly registrationKey: 'createPublicLinkForMediaItems';
      };
      readonly deleteAlbum: {
        readonly contractName: 'DeleteAlbum';
        readonly registrationKey: 'deleteAlbum';
      };
      readonly deleteAlbumItems: {
        readonly contractName: 'DeleteAlbumItems';
        readonly registrationKey: 'deleteAlbumItems';
      };
      readonly deleteComment: {
        readonly contractName: 'DeleteComment';
        readonly registrationKey: 'deleteComment';
      };
      readonly deleteMediaItem: {
        readonly contractName: 'DeleteMediaItem';
        readonly registrationKey: 'deleteMediaItem';
      };
      readonly deleteMediaItems: {
        readonly contractName: 'DeleteMediaItems';
        readonly registrationKey: 'deleteMediaItems';
      };
      readonly editComment: {
        readonly contractName: 'EditComment';
        readonly registrationKey: 'editComment';
      };
      readonly finalizeMediaItemUpload: {
        readonly contractName: 'FinalizeMediaItemUpload';
        readonly registrationKey: 'finalizeMediaItemUpload';
      };
      readonly grantAuthorizationForMediaItems: {
        readonly contractName: 'GrantAuthorizationForMediaItems';
        readonly registrationKey: 'grantAuthorizationForMediaItems';
      };
      readonly grantUserAuthorizationForAlbum: {
        readonly contractName: 'GrantUserAuthorizationForAlbum';
        readonly registrationKey: 'grantUserAuthorizationForAlbum';
      };
      readonly removeReaction: {
        readonly contractName: 'RemoveReaction';
        readonly registrationKey: 'removeReaction';
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
};

export const iocManifest = {
  manifestSchemaVersion: 2,

  moduleImports: [
    ioc_application_media_s3MediaStorage,
    ioc_infrastructure_repositories_runInTransaction,
    ioc_repositories_domainRepositories_albumRepository,
    ioc_repositories_domainRepositories_commentRepository,
    ioc_repositories_domainRepositories_grantRepository,
    ioc_repositories_domainRepositories_mediaItemRepository,
    ioc_repositories_domainRepositories_notificationRepository,
    ioc_repositories_domainRepositories_reactionRepository,
    ioc_repositories_domainRepositories_userRepository,
    ioc_repositories_readRepositories_albumMemberReadRepository,
    ioc_repositories_readRepositories_albumReadRepository,
    ioc_repositories_readRepositories_authorizationReadRepository,
    ioc_repositories_readRepositories_commentReadRepository,
    ioc_repositories_readRepositories_grantReadRepository,
    ioc_repositories_readRepositories_mediaItemReadRepository,
    ioc_repositories_readRepositories_publicAccessReadRepository,
    ioc_repositories_readRepositories_publicMediaItemReadRepository,
    ioc_repositories_readRepositories_reactionReadRepository,
    ioc_repositories_readRepositories_shareContactRepository,
    ioc_repositories_readRepositories_sharedWithMeReadRepository,
    ioc_repositories_readRepositories_userReadRepository,
    ioc_services_readServices_comments_commentReadService,
    ioc_services_readServices_mediaGrantService,
    ioc_services_readServices_MediaItemOperationsService,
    ioc_services_readServices_publicReadServices_publicAccessReadService,
    ioc_services_readServices_publicReadServices_publicAlbumReadService,
    ioc_services_readServices_publicReadServices_publicMediaItemReadService,
    ioc_services_readServices_readReactionService,
    ioc_services_readServices_viewerReadServices_enrichMediaItems,
    ioc_services_readServices_viewerReadServices_viewerAlbumReadService,
    ioc_services_readServices_viewerReadServices_viewerAuthorizationsReadService,
    ioc_services_readServices_viewerReadServices_viewerMediaItemReadService,
    ioc_services_readServices_viewerReadServices_viewerReactionReadService,
    ioc_services_readServices_viewerReadServices_viewerSharedContactsReadService,
    ioc_services_readServices_viewerReadServices_viewerSharedWithMeMediaItemReadService,
    ioc_services_writeServices_album_addAlbumItem,
    ioc_services_writeServices_album_addMediaItemsToAlbum,
    ioc_services_writeServices_album_createAlbum,
    ioc_services_writeServices_album_deleteAlbum,
    ioc_services_writeServices_album_deleteAlbumItems,
    ioc_services_writeServices_album_reorderAlbumItems,
    ioc_services_writeServices_album_setCoverMedia,
    ioc_services_writeServices_album_unsetCoverMedia,
    ioc_services_writeServices_authorization_grantAuthorizationForAlbum,
    ioc_services_writeServices_authorization_grantAuthorizationForMediaItems,
    ioc_services_writeServices_comments_addComment,
    ioc_services_writeServices_comments_deleteComment,
    ioc_services_writeServices_comments_editComment,
    ioc_services_writeServices_mediaItem_createMediaItemUpload,
    ioc_services_writeServices_mediaItem_deleteMediaItem,
    ioc_services_writeServices_mediaItem_deleteMediaItems,
    ioc_services_writeServices_mediaItem_finalizeMediaItemUpload,
    ioc_services_writeServices_mediaItem_updateMediaItem,
    ioc_services_writeServices_mediaItem_updateMediaItemTags,
    ioc_services_writeServices_publicLink_createPublicLinkForAlbum,
    ioc_services_writeServices_publicLink_createPublicLinkForMediaItems,
    ioc_services_writeServices_reactions_addReaction,
    ioc_services_writeServices_reactions_removeReaction,
  ] as const satisfies readonly IocModuleNamespace[],

  contracts: {
    AddAlbumItem: {
      addAlbumItem: {
        exportName: 'build__AddAlbumItem',
        registrationKey: 'addAlbumItem',
        modulePath: 'services/writeServices/album/addAlbumItem.ts',
        relImport: '../services/writeServices/album/addAlbumItem.js',
        contractName: 'AddAlbumItem',
        implementationName: 'addAlbumItem',
        lifetime: 'singleton',
        moduleIndex: 35,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumRepository',
          'CreateTransaction',
          'MediaItemReadRepository',
        ],
      },
    },
    AddComment: {
      addComment: {
        exportName: 'build__AddComment',
        registrationKey: 'addComment',
        modulePath: 'services/writeServices/comments/addComment.ts',
        relImport: '../services/writeServices/comments/addComment.js',
        contractName: 'AddComment',
        implementationName: 'addComment',
        lifetime: 'singleton',
        moduleIndex: 45,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'CommentRepository',
          'UserReadRepository',
          'ValidateOperationService',
        ],
      },
    },
    AddMediaItemsToAlbum: {
      addMediaItemsToAlbum: {
        exportName: 'build__AddMediaItemsToAlbum',
        registrationKey: 'addMediaItemsToAlbum',
        modulePath: 'services/writeServices/album/addMediaItemsToAlbum.ts',
        relImport: '../services/writeServices/album/addMediaItemsToAlbum.js',
        contractName: 'AddMediaItemsToAlbum',
        implementationName: 'addMediaItemsToAlbum',
        lifetime: 'singleton',
        moduleIndex: 36,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumRepository',
          'CreateTransaction',
          'MediaItemReadRepository',
        ],
      },
    },
    AddReaction: {
      addReaction: {
        exportName: 'build__AddReaction',
        registrationKey: 'addReaction',
        modulePath: 'services/writeServices/reactions/addReaction.ts',
        relImport: '../services/writeServices/reactions/addReaction.js',
        contractName: 'AddReaction',
        implementationName: 'addReaction',
        lifetime: 'singleton',
        moduleIndex: 56,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'CommentReadRepository',
          'CommentRepository',
          'MediaItemReadRepository',
          'MediaItemRepository',
          'ReactionRepository',
        ],
      },
    },
    AlbumMemberReadRepository: {
      albumMemberReadRepository: {
        exportName: 'build__AlbumMemberReadRepository',
        registrationKey: 'albumMemberReadRepository',
        modulePath: 'repositories/readRepositories/albumMemberReadRepository.ts',
        relImport: '../repositories/readRepositories/albumMemberReadRepository.js',
        contractName: 'AlbumMemberReadRepository',
        implementationName: 'albumMemberReadRepository',
        lifetime: 'singleton',
        moduleIndex: 9,
        default: true,
        discoveredBy: 'naming',
      },
    },
    AlbumReadRepository: {
      albumReadRepository: {
        exportName: 'build__AlbumReadRepository',
        registrationKey: 'albumReadRepository',
        modulePath: 'repositories/readRepositories/albumReadRepository.ts',
        relImport: '../repositories/readRepositories/albumReadRepository.js',
        contractName: 'AlbumReadRepository',
        implementationName: 'albumReadRepository',
        lifetime: 'singleton',
        moduleIndex: 10,
        default: true,
        discoveredBy: 'naming',
      },
    },
    AlbumRepository: {
      albumRepository: {
        exportName: 'build__AlbumRepository',
        registrationKey: 'albumRepository',
        modulePath: 'repositories/domainRepositories/albumRepository.ts',
        relImport: '../repositories/domainRepositories/albumRepository.js',
        contractName: 'AlbumRepository',
        implementationName: 'albumRepository',
        lifetime: 'singleton',
        moduleIndex: 2,
        default: true,
        discoveredBy: 'naming',
      },
    },
    AuthorizationReadRepository: {
      authorizationReadRepository: {
        exportName: 'build__AuthorizationReadRepository',
        registrationKey: 'authorizationReadRepository',
        modulePath: 'repositories/readRepositories/authorizationReadRepository.ts',
        relImport: '../repositories/readRepositories/authorizationReadRepository.js',
        contractName: 'AuthorizationReadRepository',
        implementationName: 'authorizationReadRepository',
        lifetime: 'singleton',
        moduleIndex: 11,
        default: true,
        discoveredBy: 'naming',
      },
    },
    CommentReadRepository: {
      commentReadRepository: {
        exportName: 'build__CommentReadRepository',
        registrationKey: 'commentReadRepository',
        modulePath: 'repositories/readRepositories/commentReadRepository.ts',
        relImport: '../repositories/readRepositories/commentReadRepository.js',
        contractName: 'CommentReadRepository',
        implementationName: 'commentReadRepository',
        lifetime: 'singleton',
        moduleIndex: 12,
        default: true,
        discoveredBy: 'naming',
      },
    },
    CommentReadService: {
      commentReadService: {
        exportName: 'build__CommentReadService',
        registrationKey: 'commentReadService',
        modulePath: 'services/readServices/comments/commentReadService.ts',
        relImport: '../services/readServices/comments/commentReadService.js',
        contractName: 'CommentReadService',
        implementationName: 'commentReadService',
        lifetime: 'singleton',
        moduleIndex: 21,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'CommentReadRepository',
          'ReactionReadRepository',
          'ReadReactionService',
        ],
      },
    },
    CommentRepository: {
      commentRepository: {
        exportName: 'build__CommentRepository',
        registrationKey: 'commentRepository',
        modulePath: 'repositories/domainRepositories/commentRepository.ts',
        relImport: '../repositories/domainRepositories/commentRepository.js',
        contractName: 'CommentRepository',
        implementationName: 'commentRepository',
        lifetime: 'singleton',
        moduleIndex: 3,
        default: true,
        discoveredBy: 'naming',
      },
    },
    CreateAlbum: {
      createAlbum: {
        exportName: 'build__CreateAlbum',
        registrationKey: 'createAlbum',
        modulePath: 'services/writeServices/album/createAlbum.ts',
        relImport: '../services/writeServices/album/createAlbum.js',
        contractName: 'CreateAlbum',
        implementationName: 'createAlbum',
        lifetime: 'singleton',
        moduleIndex: 37,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'CreateTransaction'],
      },
    },
    CreateMediaUpload: {
      createMediaItemUpload: {
        exportName: 'build__CreateMediaItemUpload',
        registrationKey: 'createMediaItemUpload',
        modulePath: 'services/writeServices/mediaItem/createMediaItemUpload.ts',
        relImport: '../services/writeServices/mediaItem/createMediaItemUpload.js',
        contractName: 'CreateMediaUpload',
        implementationName: 'createMediaItemUpload',
        lifetime: 'singleton',
        moduleIndex: 48,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['MediaItemRepository', 'MediaStorage'],
      },
    },
    CreatePublicLinkForAlbum: {
      createPublicLinkForAlbum: {
        exportName: 'build__CreatePublicLinkForAlbum',
        registrationKey: 'createPublicLinkForAlbum',
        modulePath: 'services/writeServices/publicLink/createPublicLinkForAlbum.ts',
        relImport: '../services/writeServices/publicLink/createPublicLinkForAlbum.js',
        contractName: 'CreatePublicLinkForAlbum',
        implementationName: 'createPublicLinkForAlbum',
        lifetime: 'singleton',
        moduleIndex: 54,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'CreateTransaction', 'GrantRepository'],
      },
    },
    CreatePublicLinkForMediaItems: {
      createPublicLinkForMediaItems: {
        exportName: 'build__CreatePublicLinkForMediaItems',
        registrationKey: 'createPublicLinkForMediaItems',
        modulePath: 'services/writeServices/publicLink/createPublicLinkForMediaItems.ts',
        relImport: '../services/writeServices/publicLink/createPublicLinkForMediaItems.js',
        contractName: 'CreatePublicLinkForMediaItems',
        implementationName: 'createPublicLinkForMediaItems',
        lifetime: 'singleton',
        moduleIndex: 55,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumRepository',
          'CreatePublicLinkForAlbum',
          'MediaItemRepository',
        ],
      },
    },
    CreateTransaction: {
      createTransaction: {
        exportName: 'build__CreateTransaction',
        registrationKey: 'createTransaction',
        modulePath: 'infrastructure/repositories/runInTransaction.ts',
        relImport: '../infrastructure/repositories/runInTransaction.js',
        contractName: 'CreateTransaction',
        implementationName: 'createTransaction',
        lifetime: 'singleton',
        moduleIndex: 1,
        default: true,
        discoveredBy: 'naming',
      },
    },
    DeleteAlbum: {
      deleteAlbum: {
        exportName: 'build__DeleteAlbum',
        registrationKey: 'deleteAlbum',
        modulePath: 'services/writeServices/album/deleteAlbum.ts',
        relImport: '../services/writeServices/album/deleteAlbum.js',
        contractName: 'DeleteAlbum',
        implementationName: 'deleteAlbum',
        lifetime: 'singleton',
        moduleIndex: 38,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    DeleteAlbumItems: {
      deleteAlbumItems: {
        exportName: 'build__DeleteAlbumItems',
        registrationKey: 'deleteAlbumItems',
        modulePath: 'services/writeServices/album/deleteAlbumItems.ts',
        relImport: '../services/writeServices/album/deleteAlbumItems.js',
        contractName: 'DeleteAlbumItems',
        implementationName: 'deleteAlbumItems',
        lifetime: 'singleton',
        moduleIndex: 39,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    DeleteComment: {
      deleteComment: {
        exportName: 'build__DeleteComment',
        registrationKey: 'deleteComment',
        modulePath: 'services/writeServices/comments/deleteComment.ts',
        relImport: '../services/writeServices/comments/deleteComment.js',
        contractName: 'DeleteComment',
        implementationName: 'deleteComment',
        lifetime: 'singleton',
        moduleIndex: 46,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['CommentRepository'],
      },
    },
    DeleteMediaItem: {
      deleteMediaItem: {
        exportName: 'build__DeleteMediaItem',
        registrationKey: 'deleteMediaItem',
        modulePath: 'services/writeServices/mediaItem/deleteMediaItem.ts',
        relImport: '../services/writeServices/mediaItem/deleteMediaItem.js',
        contractName: 'DeleteMediaItem',
        implementationName: 'deleteMediaItem',
        lifetime: 'singleton',
        moduleIndex: 49,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumReadRepository',
          'AlbumRepository',
          'MediaItemRepository',
          'MediaStorage',
        ],
      },
    },
    DeleteMediaItems: {
      deleteMediaItems: {
        exportName: 'build__DeleteMediaItems',
        registrationKey: 'deleteMediaItems',
        modulePath: 'services/writeServices/mediaItem/deleteMediaItems.ts',
        relImport: '../services/writeServices/mediaItem/deleteMediaItems.js',
        contractName: 'DeleteMediaItems',
        implementationName: 'deleteMediaItems',
        lifetime: 'singleton',
        moduleIndex: 50,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumReadRepository',
          'AlbumRepository',
          'MediaItemReadRepository',
          'MediaItemRepository',
          'MediaStorage',
        ],
      },
    },
    EditComment: {
      editComment: {
        exportName: 'build__EditComment',
        registrationKey: 'editComment',
        modulePath: 'services/writeServices/comments/editComment.ts',
        relImport: '../services/writeServices/comments/editComment.js',
        contractName: 'EditComment',
        implementationName: 'editComment',
        lifetime: 'singleton',
        moduleIndex: 47,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['CommentRepository'],
      },
    },
    EnrichMediaItems: {
      enrichMediaItems: {
        exportName: 'build__EnrichMediaItems',
        registrationKey: 'enrichMediaItems',
        modulePath: 'services/readServices/viewerReadServices/enrichMediaItems.ts',
        relImport: '../services/readServices/viewerReadServices/enrichMediaItems.js',
        contractName: 'EnrichMediaItems',
        implementationName: 'enrichMediaItems',
        lifetime: 'singleton',
        moduleIndex: 28,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'MediaItemOperationsService',
          'MediaItemReadRepository',
          'ReactionReadRepository',
          'ReadReactionService',
        ],
      },
    },
    FinalizeMediaItemUpload: {
      finalizeMediaItemUpload: {
        exportName: 'build__FinalizeMediaItemUpload',
        registrationKey: 'finalizeMediaItemUpload',
        modulePath: 'services/writeServices/mediaItem/finalizeMediaItemUpload.ts',
        relImport: '../services/writeServices/mediaItem/finalizeMediaItemUpload.js',
        contractName: 'FinalizeMediaItemUpload',
        implementationName: 'finalizeMediaItemUpload',
        lifetime: 'singleton',
        moduleIndex: 51,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['MediaItemRepository', 'MediaStorage'],
      },
    },
    GrantAuthorizationForMediaItems: {
      grantAuthorizationForMediaItems: {
        exportName: 'build__GrantAuthorizationForMediaItems',
        registrationKey: 'grantAuthorizationForMediaItems',
        modulePath: 'services/writeServices/authorization/grantAuthorizationForMediaItems.ts',
        relImport: '../services/writeServices/authorization/grantAuthorizationForMediaItems.js',
        contractName: 'GrantAuthorizationForMediaItems',
        implementationName: 'grantAuthorizationForMediaItems',
        lifetime: 'singleton',
        moduleIndex: 44,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'CreateTransaction',
          'GrantRepository',
          'MediaItemRepository',
          'ShareContactRepository',
          'UserRepository',
        ],
      },
    },
    GrantReadRepository: {
      grantReadRepository: {
        exportName: 'build__GrantReadRepository',
        registrationKey: 'grantReadRepository',
        modulePath: 'repositories/readRepositories/grantReadRepository.ts',
        relImport: '../repositories/readRepositories/grantReadRepository.js',
        contractName: 'GrantReadRepository',
        implementationName: 'grantReadRepository',
        lifetime: 'singleton',
        moduleIndex: 13,
        default: true,
        discoveredBy: 'naming',
      },
    },
    GrantRepository: {
      grantRepository: {
        exportName: 'build__GrantRepository',
        registrationKey: 'grantRepository',
        modulePath: 'repositories/domainRepositories/grantRepository.ts',
        relImport: '../repositories/domainRepositories/grantRepository.js',
        contractName: 'GrantRepository',
        implementationName: 'grantRepository',
        lifetime: 'singleton',
        moduleIndex: 4,
        default: true,
        discoveredBy: 'naming',
      },
    },
    GrantUserAuthorizationForAlbum: {
      grantUserAuthorizationForAlbum: {
        exportName: 'build__GrantUserAuthorizationForAlbum',
        registrationKey: 'grantUserAuthorizationForAlbum',
        modulePath: 'services/writeServices/authorization/grantAuthorizationForAlbum.ts',
        relImport: '../services/writeServices/authorization/grantAuthorizationForAlbum.js',
        contractName: 'GrantUserAuthorizationForAlbum',
        implementationName: 'grantUserAuthorizationForAlbum',
        lifetime: 'singleton',
        moduleIndex: 43,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumRepository',
          'CreateTransaction',
          'GrantRepository',
          'ShareContactRepository',
          'UserRepository',
        ],
      },
    },
    MediaItemOperationsService: {
      mediaItemOperationsService: {
        exportName: 'build__MediaItemOperationsService',
        registrationKey: 'mediaItemOperationsService',
        modulePath: 'services/readServices/MediaItemOperationsService.ts',
        relImport: '../services/readServices/MediaItemOperationsService.js',
        contractName: 'MediaItemOperationsService',
        implementationName: 'mediaItemOperationsService',
        lifetime: 'singleton',
        moduleIndex: 23,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AuthorizationReadRepository'],
      },
    },
    MediaItemReadRepository: {
      mediaItemReadRepository: {
        exportName: 'build__MediaItemReadRepository',
        registrationKey: 'mediaItemReadRepository',
        modulePath: 'repositories/readRepositories/mediaItemReadRepository.ts',
        relImport: '../repositories/readRepositories/mediaItemReadRepository.js',
        contractName: 'MediaItemReadRepository',
        implementationName: 'mediaItemReadRepository',
        lifetime: 'singleton',
        moduleIndex: 14,
        default: true,
        discoveredBy: 'naming',
      },
    },
    MediaItemRepository: {
      mediaItemRepository: {
        exportName: 'build__MediaItemRepository',
        registrationKey: 'mediaItemRepository',
        modulePath: 'repositories/domainRepositories/mediaItemRepository.ts',
        relImport: '../repositories/domainRepositories/mediaItemRepository.js',
        contractName: 'MediaItemRepository',
        implementationName: 'mediaItemRepository',
        lifetime: 'singleton',
        moduleIndex: 5,
        default: true,
        discoveredBy: 'naming',
      },
    },
    MediaStorage: {
      mediaStorage: {
        exportName: 'build__MediaStorage',
        registrationKey: 'mediaStorage',
        modulePath: 'application/media/s3MediaStorage.ts',
        relImport: '../application/media/s3MediaStorage.js',
        contractName: 'MediaStorage',
        implementationName: 'mediaStorage',
        lifetime: 'singleton',
        moduleIndex: 0,
        default: true,
        discoveredBy: 'naming',
      },
    },
    NotificationRepository: {
      notificationRepository: {
        exportName: 'build__NotificationRepository',
        registrationKey: 'notificationRepository',
        modulePath: 'repositories/domainRepositories/notificationRepository.ts',
        relImport: '../repositories/domainRepositories/notificationRepository.js',
        contractName: 'NotificationRepository',
        implementationName: 'notificationRepository',
        lifetime: 'singleton',
        moduleIndex: 6,
        default: true,
        discoveredBy: 'naming',
      },
    },
    PublicAccessReadRepository: {
      publicAccessReadRepository: {
        exportName: 'build__PublicAccessReadRepository',
        registrationKey: 'publicAccessReadRepository',
        modulePath: 'repositories/readRepositories/publicAccessReadRepository.ts',
        relImport: '../repositories/readRepositories/publicAccessReadRepository.js',
        contractName: 'PublicAccessReadRepository',
        implementationName: 'publicAccessReadRepository',
        lifetime: 'singleton',
        moduleIndex: 15,
        default: true,
        discoveredBy: 'naming',
      },
    },
    PublicAccessReadService: {
      publicAccessReadService: {
        exportName: 'build__PublicAccessReadService',
        registrationKey: 'publicAccessReadService',
        modulePath: 'services/readServices/publicReadServices/publicAccessReadService.ts',
        relImport: '../services/readServices/publicReadServices/publicAccessReadService.js',
        contractName: 'PublicAccessReadService',
        implementationName: 'publicAccessReadService',
        lifetime: 'singleton',
        moduleIndex: 24,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['PublicAccessReadRepository'],
      },
    },
    PublicAlbumReadServiceFactory: {
      publicAlbumReadServiceFactory: {
        exportName: 'build__PublicAlbumReadServiceFactory',
        registrationKey: 'publicAlbumReadServiceFactory',
        modulePath: 'services/readServices/publicReadServices/publicAlbumReadService.ts',
        relImport: '../services/readServices/publicReadServices/publicAlbumReadService.js',
        contractName: 'PublicAlbumReadServiceFactory',
        implementationName: 'publicAlbumReadServiceFactory',
        lifetime: 'singleton',
        moduleIndex: 25,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumReadRepository', 'EnrichMediaItems'],
      },
    },
    PublicMediaItemReadRepository: {
      publicMediaItemReadRepository: {
        exportName: 'build__PublicMediaItemReadRepository',
        registrationKey: 'publicMediaItemReadRepository',
        modulePath: 'repositories/readRepositories/publicMediaItemReadRepository.ts',
        relImport: '../repositories/readRepositories/publicMediaItemReadRepository.js',
        contractName: 'PublicMediaItemReadRepository',
        implementationName: 'publicMediaItemReadRepository',
        lifetime: 'singleton',
        moduleIndex: 16,
        default: true,
        discoveredBy: 'naming',
      },
    },
    PublicMediaItemReadServiceFactory: {
      publicMediaItemReadServiceFactory: {
        exportName: 'build__PublicMediaItemReadServiceFactory',
        registrationKey: 'publicMediaItemReadServiceFactory',
        modulePath: 'services/readServices/publicReadServices/publicMediaItemReadService.ts',
        relImport: '../services/readServices/publicReadServices/publicMediaItemReadService.js',
        contractName: 'PublicMediaItemReadServiceFactory',
        implementationName: 'publicMediaItemReadServiceFactory',
        lifetime: 'singleton',
        moduleIndex: 26,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['EnrichMediaItems', 'PublicMediaItemReadRepository'],
      },
    },
    ReactionReadRepository: {
      reactionReadRepository: {
        exportName: 'build__ReactionReadRepository',
        registrationKey: 'reactionReadRepository',
        modulePath: 'repositories/readRepositories/reactionReadRepository.ts',
        relImport: '../repositories/readRepositories/reactionReadRepository.js',
        contractName: 'ReactionReadRepository',
        implementationName: 'reactionReadRepository',
        lifetime: 'singleton',
        moduleIndex: 17,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ReactionRepository: {
      reactionRepository: {
        exportName: 'build__ReactionRepository',
        registrationKey: 'reactionRepository',
        modulePath: 'repositories/domainRepositories/reactionRepository.ts',
        relImport: '../repositories/domainRepositories/reactionRepository.js',
        contractName: 'ReactionRepository',
        implementationName: 'reactionRepository',
        lifetime: 'singleton',
        moduleIndex: 7,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ReadReactionService: {
      readReactionService: {
        exportName: 'build__ReadReactionService',
        registrationKey: 'readReactionService',
        modulePath: 'services/readServices/readReactionService.ts',
        relImport: '../services/readServices/readReactionService.js',
        contractName: 'ReadReactionService',
        implementationName: 'readReactionService',
        lifetime: 'singleton',
        moduleIndex: 27,
        default: true,
        discoveredBy: 'naming',
      },
    },
    RemoveReaction: {
      removeReaction: {
        exportName: 'build__RemoveReaction',
        registrationKey: 'removeReaction',
        modulePath: 'services/writeServices/reactions/removeReaction.ts',
        relImport: '../services/writeServices/reactions/removeReaction.js',
        contractName: 'RemoveReaction',
        implementationName: 'removeReaction',
        lifetime: 'singleton',
        moduleIndex: 57,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'CommentReadRepository',
          'CommentRepository',
          'MediaItemReadRepository',
          'MediaItemRepository',
          'ReactionRepository',
        ],
      },
    },
    ReorderAlbumItems: {
      reorderAlbumItems: {
        exportName: 'build__ReorderAlbumItems',
        registrationKey: 'reorderAlbumItems',
        modulePath: 'services/writeServices/album/reorderAlbumItems.ts',
        relImport: '../services/writeServices/album/reorderAlbumItems.js',
        contractName: 'ReorderAlbumItems',
        implementationName: 'reorderAlbumItems',
        lifetime: 'singleton',
        moduleIndex: 40,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'CreateTransaction'],
      },
    },
    SetCoverMedia: {
      setCoverMedia: {
        exportName: 'build__SetCoverMedia',
        registrationKey: 'setCoverMedia',
        modulePath: 'services/writeServices/album/setCoverMedia.ts',
        relImport: '../services/writeServices/album/setCoverMedia.js',
        contractName: 'SetCoverMedia',
        implementationName: 'setCoverMedia',
        lifetime: 'singleton',
        moduleIndex: 41,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'CreateTransaction'],
      },
    },
    ShareContactRepository: {
      shareContactRepository: {
        exportName: 'build__ShareContactRepository',
        registrationKey: 'shareContactRepository',
        modulePath: 'repositories/readRepositories/shareContactRepository.ts',
        relImport: '../repositories/readRepositories/shareContactRepository.js',
        contractName: 'ShareContactRepository',
        implementationName: 'shareContactRepository',
        lifetime: 'singleton',
        moduleIndex: 18,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SharedWithMeReadRepository: {
      sharedWithMeReadRepository: {
        exportName: 'build__SharedWithMeReadRepository',
        registrationKey: 'sharedWithMeReadRepository',
        modulePath: 'repositories/readRepositories/sharedWithMeReadRepository.ts',
        relImport: '../repositories/readRepositories/sharedWithMeReadRepository.js',
        contractName: 'SharedWithMeReadRepository',
        implementationName: 'sharedWithMeReadRepository',
        lifetime: 'singleton',
        moduleIndex: 19,
        default: true,
        discoveredBy: 'naming',
      },
    },
    UnsetCoverMedia: {
      unsetCoverMedia: {
        exportName: 'build__UnsetCoverMedia',
        registrationKey: 'unsetCoverMedia',
        modulePath: 'services/writeServices/album/unsetCoverMedia.ts',
        relImport: '../services/writeServices/album/unsetCoverMedia.js',
        contractName: 'UnsetCoverMedia',
        implementationName: 'unsetCoverMedia',
        lifetime: 'singleton',
        moduleIndex: 42,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'CreateTransaction'],
      },
    },
    UpdateMediaItem: {
      updateMediaItem: {
        exportName: 'build__UpdateMediaItem',
        registrationKey: 'updateMediaItem',
        modulePath: 'services/writeServices/mediaItem/updateMediaItem.ts',
        relImport: '../services/writeServices/mediaItem/updateMediaItem.js',
        contractName: 'UpdateMediaItem',
        implementationName: 'updateMediaItem',
        lifetime: 'singleton',
        moduleIndex: 52,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['MediaItemRepository'],
      },
    },
    UpdateMediaItemTags: {
      updateMediaItemTags: {
        exportName: 'build__UpdateMediaItemTags',
        registrationKey: 'updateMediaItemTags',
        modulePath: 'services/writeServices/mediaItem/updateMediaItemTags.ts',
        relImport: '../services/writeServices/mediaItem/updateMediaItemTags.js',
        contractName: 'UpdateMediaItemTags',
        implementationName: 'updateMediaItemTags',
        lifetime: 'singleton',
        moduleIndex: 53,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['MediaItemRepository'],
      },
    },
    UserReadRepository: {
      userReadRepository: {
        exportName: 'build__UserReadRepository',
        registrationKey: 'userReadRepository',
        modulePath: 'repositories/readRepositories/userReadRepository.ts',
        relImport: '../repositories/readRepositories/userReadRepository.js',
        contractName: 'UserReadRepository',
        implementationName: 'userReadRepository',
        lifetime: 'singleton',
        moduleIndex: 20,
        default: true,
        discoveredBy: 'naming',
      },
    },
    UserRepository: {
      userRepository: {
        exportName: 'build__UserRepository',
        registrationKey: 'userRepository',
        modulePath: 'repositories/domainRepositories/userRepository.ts',
        relImport: '../repositories/domainRepositories/userRepository.js',
        contractName: 'UserRepository',
        implementationName: 'userRepository',
        lifetime: 'singleton',
        moduleIndex: 8,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ValidateOperationService: {
      validateOperationService: {
        exportName: 'build__ValidateOperationService',
        registrationKey: 'validateOperationService',
        modulePath: 'services/readServices/mediaGrantService.ts',
        relImport: '../services/readServices/mediaGrantService.js',
        contractName: 'ValidateOperationService',
        implementationName: 'validateOperationService',
        lifetime: 'singleton',
        moduleIndex: 22,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumMemberReadRepository',
          'GrantReadRepository',
          'MediaItemReadRepository',
        ],
      },
    },
    ViewerAlbumReadServiceFactory: {
      viewerAlbumReadServiceFactory: {
        exportName: 'build__ViewerAlbumReadServiceFactory',
        registrationKey: 'viewerAlbumReadServiceFactory',
        modulePath: 'services/readServices/viewerReadServices/viewerAlbumReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerAlbumReadService.js',
        contractName: 'ViewerAlbumReadServiceFactory',
        implementationName: 'viewerAlbumReadServiceFactory',
        lifetime: 'singleton',
        moduleIndex: 29,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumReadRepository', 'EnrichMediaItems'],
      },
    },
    viewerAuthorizationsReadServiceFactory: {
      viewerAuthorizationsReadServiceFactory: {
        exportName: 'build__viewerAuthorizationsReadServiceFactory',
        registrationKey: 'viewerAuthorizationsReadServiceFactory',
        modulePath: 'services/readServices/viewerReadServices/viewerAuthorizationsReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerAuthorizationsReadService.js',
        contractName: 'viewerAuthorizationsReadServiceFactory',
        implementationName: 'viewerAuthorizationsReadServiceFactory',
        lifetime: 'singleton',
        moduleIndex: 30,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AuthorizationReadRepository'],
      },
    },
    ViewerMediaItemReadServiceFactory: {
      viewerMediaItemReadServiceFactory: {
        exportName: 'build__ViewerMediaItemReadServiceFactory',
        registrationKey: 'viewerMediaItemReadServiceFactory',
        modulePath: 'services/readServices/viewerReadServices/viewerMediaItemReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerMediaItemReadService.js',
        contractName: 'ViewerMediaItemReadServiceFactory',
        implementationName: 'viewerMediaItemReadServiceFactory',
        lifetime: 'singleton',
        moduleIndex: 31,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AuthorizationReadRepository',
          'EnrichMediaItems',
          'MediaItemReadRepository',
        ],
      },
    },
    ViewerReactionReadServiceFactory: {
      viewerReactionReadServiceFactory: {
        exportName: 'build__viewerReactionReadServiceFactory',
        registrationKey: 'viewerReactionReadServiceFactory',
        modulePath: 'services/readServices/viewerReadServices/viewerReactionReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerReactionReadService.js',
        contractName: 'ViewerReactionReadServiceFactory',
        implementationName: 'viewerReactionReadServiceFactory',
        lifetime: 'singleton',
        moduleIndex: 32,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['ReactionReadRepository'],
      },
    },
    ViewerSharedContactsReadServiceFactory: {
      viewerSharedContactsReadServiceFactory: {
        exportName: 'build__ViewerSharedContactsReadServiceFactory',
        registrationKey: 'viewerSharedContactsReadServiceFactory',
        modulePath: 'services/readServices/viewerReadServices/viewerSharedContactsReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerSharedContactsReadService.js',
        contractName: 'ViewerSharedContactsReadServiceFactory',
        implementationName: 'viewerSharedContactsReadServiceFactory',
        lifetime: 'singleton',
        moduleIndex: 33,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['ShareContactRepository'],
      },
    },
    ViewerSharedWithMeMediaItemReadServiceFactory: {
      viewerSharedWithMeMediaItemReadServiceFactory: {
        exportName: 'build__ViewerSharedWithMeMediaItemReadServiceFactory',
        registrationKey: 'viewerSharedWithMeMediaItemReadServiceFactory',
        modulePath:
          'services/readServices/viewerReadServices/viewerSharedWithMeMediaItemReadService.ts',
        relImport:
          '../services/readServices/viewerReadServices/viewerSharedWithMeMediaItemReadService.js',
        contractName: 'ViewerSharedWithMeMediaItemReadServiceFactory',
        implementationName: 'viewerSharedWithMeMediaItemReadServiceFactory',
        lifetime: 'singleton',
        moduleIndex: 34,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['EnrichMediaItems', 'SharedWithMeReadRepository'],
      },
    },
  },
  // agnosticReadServices
  agnosticReadServices: {
    kind: 'object',
    baseType: 'AgnosticReadServiceBase',
    baseTypeId:
      '/home/reharik/Development/photoapp/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:AgnosticReadServiceBase',
    members: {
      commentReadService: {
        contractName: 'CommentReadService',
        registrationKey: 'commentReadService',
      },
      publicAccessReadService: {
        contractName: 'PublicAccessReadService',
        registrationKey: 'publicAccessReadService',
      },
    },
  },

  // publicReadServiceFactories
  publicReadServiceFactories: {
    kind: 'object',
    baseType: 'PublicReadServiceFactoryBase',
    baseTypeId:
      '/home/reharik/Development/photoapp/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:PublicReadServiceFactoryBase',
    members: {
      publicAlbumReadServiceFactory: {
        contractName: 'PublicAlbumReadServiceFactory',
        registrationKey: 'publicAlbumReadServiceFactory',
      },
      publicMediaItemReadServiceFactory: {
        contractName: 'PublicMediaItemReadServiceFactory',
        registrationKey: 'publicMediaItemReadServiceFactory',
      },
    },
  },

  // readServiceFactories
  readServiceFactories: {
    kind: 'object',
    baseType: 'ReadServiceFactoryBase',
    baseTypeId:
      '/home/reharik/Development/photoapp/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:ReadServiceFactoryBase',
    members: {
      viewerAlbumReadServiceFactory: {
        contractName: 'ViewerAlbumReadServiceFactory',
        registrationKey: 'viewerAlbumReadServiceFactory',
      },
      viewerAuthorizationsReadServiceFactory: {
        contractName: 'viewerAuthorizationsReadServiceFactory',
        registrationKey: 'viewerAuthorizationsReadServiceFactory',
      },
      viewerMediaItemReadServiceFactory: {
        contractName: 'ViewerMediaItemReadServiceFactory',
        registrationKey: 'viewerMediaItemReadServiceFactory',
      },
      viewerReactionReadServiceFactory: {
        contractName: 'ViewerReactionReadServiceFactory',
        registrationKey: 'viewerReactionReadServiceFactory',
      },
      viewerSharedContactsReadServiceFactory: {
        contractName: 'ViewerSharedContactsReadServiceFactory',
        registrationKey: 'viewerSharedContactsReadServiceFactory',
      },
      viewerSharedWithMeMediaItemReadServiceFactory: {
        contractName: 'ViewerSharedWithMeMediaItemReadServiceFactory',
        registrationKey: 'viewerSharedWithMeMediaItemReadServiceFactory',
      },
    },
  },

  // writeServices
  writeServices: {
    kind: 'object',
    baseType: 'WriteServiceBase',
    baseTypeId:
      '/home/reharik/Development/photoapp/packages/context/media-core/src/services/writeServices/writeServiceBaseType.ts:WriteServiceBase',
    members: {
      addAlbumItem: {
        contractName: 'AddAlbumItem',
        registrationKey: 'addAlbumItem',
      },
      addComment: {
        contractName: 'AddComment',
        registrationKey: 'addComment',
      },
      addMediaItemsToAlbum: {
        contractName: 'AddMediaItemsToAlbum',
        registrationKey: 'addMediaItemsToAlbum',
      },
      addReaction: {
        contractName: 'AddReaction',
        registrationKey: 'addReaction',
      },
      createAlbum: {
        contractName: 'CreateAlbum',
        registrationKey: 'createAlbum',
      },
      createMediaUpload: {
        contractName: 'CreateMediaUpload',
        registrationKey: 'createMediaItemUpload',
      },
      createPublicLinkForAlbum: {
        contractName: 'CreatePublicLinkForAlbum',
        registrationKey: 'createPublicLinkForAlbum',
      },
      createPublicLinkForMediaItems: {
        contractName: 'CreatePublicLinkForMediaItems',
        registrationKey: 'createPublicLinkForMediaItems',
      },
      deleteAlbum: {
        contractName: 'DeleteAlbum',
        registrationKey: 'deleteAlbum',
      },
      deleteAlbumItems: {
        contractName: 'DeleteAlbumItems',
        registrationKey: 'deleteAlbumItems',
      },
      deleteComment: {
        contractName: 'DeleteComment',
        registrationKey: 'deleteComment',
      },
      deleteMediaItem: {
        contractName: 'DeleteMediaItem',
        registrationKey: 'deleteMediaItem',
      },
      deleteMediaItems: {
        contractName: 'DeleteMediaItems',
        registrationKey: 'deleteMediaItems',
      },
      editComment: {
        contractName: 'EditComment',
        registrationKey: 'editComment',
      },
      finalizeMediaItemUpload: {
        contractName: 'FinalizeMediaItemUpload',
        registrationKey: 'finalizeMediaItemUpload',
      },
      grantAuthorizationForMediaItems: {
        contractName: 'GrantAuthorizationForMediaItems',
        registrationKey: 'grantAuthorizationForMediaItems',
      },
      grantUserAuthorizationForAlbum: {
        contractName: 'GrantUserAuthorizationForAlbum',
        registrationKey: 'grantUserAuthorizationForAlbum',
      },
      removeReaction: {
        contractName: 'RemoveReaction',
        registrationKey: 'removeReaction',
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
  },
} as const satisfies IocGeneratedContainerManifest<IocManifestGroupRoots>;
