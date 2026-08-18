/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_application_media_s3MediaStorage from '../application/media/s3MediaStorage.js';
import * as ioc_domain_Authorization_eventHandlers_authorizationReconciliation from '../domain/Authorization/eventHandlers/authorizationReconciliation.js';
import * as ioc_domain_Authorization_eventHandlers_resolveAuthorizations from '../domain/Authorization/eventHandlers/resolveAuthorizations.js';
import * as ioc_domain_domainEvents_eventPublisher from '../domain/domainEvents/eventPublisher.js';
import * as ioc_infrastructure_repositories_unitOfWork from '../infrastructure/repositories/unitOfWork.js';
import * as ioc_notifications_dispatcher from '../notifications/dispatcher.js';
import * as ioc_notifications_strategies_notificationAlbumStrategies from '../notifications/strategies/notificationAlbumStrategies.js';
import * as ioc_notifications_strategies_notificationCommentStrategy from '../notifications/strategies/notificationCommentStrategy.js';
import * as ioc_notifications_strategies_notificationReactionStrategy from '../notifications/strategies/notificationReactionStrategy.js';
import * as ioc_notifications_writers_asyncWriter from '../notifications/writers/asyncWriter.js';
import * as ioc_notifications_writers_inAppWriter from '../notifications/writers/inAppWriter.js';
import * as ioc_repositories_domainRepositories_albumRepository from '../repositories/domainRepositories/albumRepository.js';
import * as ioc_repositories_domainRepositories_commentRepository from '../repositories/domainRepositories/commentRepository.js';
import * as ioc_repositories_domainRepositories_emailDeliverRepository from '../repositories/domainRepositories/emailDeliverRepository.js';
import * as ioc_repositories_domainRepositories_emailVerificationRepository from '../repositories/domainRepositories/emailVerificationRepository.js';
import * as ioc_repositories_domainRepositories_mediaItemRepository from '../repositories/domainRepositories/mediaItemRepository.js';
import * as ioc_repositories_domainRepositories_notificationRepository from '../repositories/domainRepositories/notificationRepository.js';
import * as ioc_repositories_domainRepositories_shareContactRepository from '../repositories/domainRepositories/shareContactRepository.js';
import * as ioc_repositories_domainRepositories_userRepository from '../repositories/domainRepositories/userRepository.js';
import * as ioc_repositories_mediaDeletionJob_mediaDeletionJobRepository from '../repositories/mediaDeletionJob/mediaDeletionJobRepository.js';
import * as ioc_repositories_mediaProcessingJob_mediaProcessingJobRepository from '../repositories/mediaProcessingJob/mediaProcessingJobRepository.js';
import * as ioc_repositories_readRepositories_albumItemReadRepository from '../repositories/readRepositories/albumItemReadRepository.js';
import * as ioc_repositories_readRepositories_albumMemberReadRepository from '../repositories/readRepositories/albumMemberReadRepository.js';
import * as ioc_repositories_readRepositories_albumReadRepository from '../repositories/readRepositories/albumReadRepository.js';
import * as ioc_repositories_readRepositories_authorizationReadRepository from '../repositories/readRepositories/authorizationReadRepository.js';
import * as ioc_repositories_readRepositories_commentReadRepository from '../repositories/readRepositories/commentReadRepository.js';
import * as ioc_repositories_readRepositories_grantReadRepository from '../repositories/readRepositories/grantReadRepository.js';
import * as ioc_repositories_readRepositories_inAppNotificationRepository from '../repositories/readRepositories/inAppNotificationRepository.js';
import * as ioc_repositories_readRepositories_mediaItemReadRepository from '../repositories/readRepositories/mediaItemReadRepository.js';
import * as ioc_repositories_readRepositories_publicAccessReadRepository from '../repositories/readRepositories/publicAccessReadRepository.js';
import * as ioc_repositories_readRepositories_publicMediaItemReadRepository from '../repositories/readRepositories/publicMediaItemReadRepository.js';
import * as ioc_repositories_readRepositories_reactionReadRepository from '../repositories/readRepositories/reactionReadRepository.js';
import * as ioc_repositories_readRepositories_shareContactReadRepository from '../repositories/readRepositories/shareContactReadRepository.js';
import * as ioc_repositories_readRepositories_sharedWithMeReadRepository from '../repositories/readRepositories/sharedWithMeReadRepository.js';
import * as ioc_repositories_readRepositories_userReadRepository from '../repositories/readRepositories/userReadRepository.js';
import * as ioc_repositories_systemRepositories_systemAlbumItemRepository from '../repositories/systemRepositories/systemAlbumItemRepository.js';
import * as ioc_repositories_systemRepositories_systemAlbumRepository from '../repositories/systemRepositories/systemAlbumRepository.js';
import * as ioc_repositories_systemRepositories_systemAsyncNotificationRepository from '../repositories/systemRepositories/systemAsyncNotificationRepository.js';
import * as ioc_repositories_systemRepositories_systemAuthorizationRepository from '../repositories/systemRepositories/systemAuthorizationRepository.js';
import * as ioc_repositories_systemRepositories_systemCommentRepository from '../repositories/systemRepositories/systemCommentRepository.js';
import * as ioc_repositories_systemRepositories_systemEmailVerificationRepository from '../repositories/systemRepositories/systemEmailVerificationRepository.js';
import * as ioc_repositories_systemRepositories_systemGrantRepository from '../repositories/systemRepositories/systemGrantRepository.js';
import * as ioc_repositories_systemRepositories_systemInAppNotificationRepository from '../repositories/systemRepositories/systemInAppNotificationRepository.js';
import * as ioc_repositories_systemRepositories_systemMediaItemRepository from '../repositories/systemRepositories/systemMediaItemRepository.js';
import * as ioc_repositories_systemRepositories_systemUserRepository from '../repositories/systemRepositories/systemUserRepository.js';
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
import * as ioc_services_readServices_viewerReadServices_viewerHasInAppNotificationService from '../services/readServices/viewerReadServices/viewerHasInAppNotificationService.js';
import * as ioc_services_readServices_viewerReadServices_viewerMediaItemReadService from '../services/readServices/viewerReadServices/viewerMediaItemReadService.js';
import * as ioc_services_readServices_viewerReadServices_viewerReactionReadService from '../services/readServices/viewerReadServices/viewerReactionReadService.js';
import * as ioc_services_readServices_viewerReadServices_viewerSharedContactsReadService from '../services/readServices/viewerReadServices/viewerSharedContactsReadService.js';
import * as ioc_services_readServices_viewerReadServices_viewerSharedWithMeAlbumReadService from '../services/readServices/viewerReadServices/viewerSharedWithMeAlbumReadService.js';
import * as ioc_services_writeServices_album_addAlbumItem from '../services/writeServices/album/addAlbumItem.js';
import * as ioc_services_writeServices_album_addAlbumMembers from '../services/writeServices/album/addAlbumMembers.js';
import * as ioc_services_writeServices_album_addMediaItemsToAlbum from '../services/writeServices/album/addMediaItemsToAlbum.js';
import * as ioc_services_writeServices_album_createAlbum from '../services/writeServices/album/createAlbum.js';
import * as ioc_services_writeServices_album_deleteAlbum from '../services/writeServices/album/deleteAlbum.js';
import * as ioc_services_writeServices_album_deleteAlbumItems from '../services/writeServices/album/deleteAlbumItems.js';
import * as ioc_services_writeServices_album_removeAlbumMembers from '../services/writeServices/album/removeAlbumMembers.js';
import * as ioc_services_writeServices_album_reorderAlbumItems from '../services/writeServices/album/reorderAlbumItems.js';
import * as ioc_services_writeServices_album_revokePublicLinkService from '../services/writeServices/album/revokePublicLinkService.js';
import * as ioc_services_writeServices_album_revokeShareService from '../services/writeServices/album/revokeShareService.js';
import * as ioc_services_writeServices_album_setCoverMedia from '../services/writeServices/album/setCoverMedia.js';
import * as ioc_services_writeServices_album_unsetCoverMedia from '../services/writeServices/album/unsetCoverMedia.js';
import * as ioc_services_writeServices_album_updateAlbumMemberRoleService from '../services/writeServices/album/updateAlbumMemberRoleService.js';
import * as ioc_services_writeServices_authorization_deleteShareContactService from '../services/writeServices/authorization/deleteShareContactService.js';
import * as ioc_services_writeServices_authorization_grantAuthorizationForAlbum from '../services/writeServices/authorization/grantAuthorizationForAlbum.js';
import * as ioc_services_writeServices_comments_addComment from '../services/writeServices/comments/addComment.js';
import * as ioc_services_writeServices_comments_deleteComment from '../services/writeServices/comments/deleteComment.js';
import * as ioc_services_writeServices_comments_editComment from '../services/writeServices/comments/editComment.js';
import * as ioc_services_writeServices_EmailDelivery_createEmailDeliveryService from '../services/writeServices/EmailDelivery/createEmailDeliveryService.js';
import * as ioc_services_writeServices_markActivitySeen from '../services/writeServices/markActivitySeen.js';
import * as ioc_services_writeServices_mediaItem_createMediaItemUpload from '../services/writeServices/mediaItem/createMediaItemUpload.js';
import * as ioc_services_writeServices_mediaItem_deleteMediaItem from '../services/writeServices/mediaItem/deleteMediaItem.js';
import * as ioc_services_writeServices_mediaItem_deleteMediaItems from '../services/writeServices/mediaItem/deleteMediaItems.js';
import * as ioc_services_writeServices_mediaItem_finalizeMediaItemUpload from '../services/writeServices/mediaItem/finalizeMediaItemUpload.js';
import * as ioc_services_writeServices_mediaItem_updateMediaItem from '../services/writeServices/mediaItem/updateMediaItem.js';
import * as ioc_services_writeServices_mediaItem_updateMediaItemTags from '../services/writeServices/mediaItem/updateMediaItemTags.js';
import * as ioc_services_writeServices_publicLink_createPublicLinkForAlbum from '../services/writeServices/publicLink/createPublicLinkForAlbum.js';
import * as ioc_services_writeServices_publicLink_createPublicLinkForMediaItems from '../services/writeServices/publicLink/createPublicLinkForMediaItems.js';
import * as ioc_services_writeServices_reactions_toggleReaction from '../services/writeServices/reactions/toggleReaction.js';
import * as ioc_services_writeServices_user_activatePendingUserWriteService from '../services/writeServices/user/activatePendingUserWriteService.js';
import * as ioc_services_writeServices_user_createUserWriteService from '../services/writeServices/user/createUserWriteService.js';

type IocManifestGroupRoots = {
  readonly agnosticReadServices: {
    readonly kind: 'object';
    readonly baseType: 'AgnosticReadServiceBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:AgnosticReadServiceBase';
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
  readonly domainEventHandlers: {
    readonly kind: 'collection';
    readonly baseType: 'DomainEventHandler';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/domain/domainEvents/eventPublisher.ts:DomainEventHandler';
    readonly members: readonly [
      {
        readonly contractName: 'DomainEventHandler';
        readonly registrationKey: 'authorizationReconciliation';
      },
      {
        readonly contractName: 'DomainEventHandler';
        readonly registrationKey: 'notificationDispatcher';
      },
    ];
  };
  readonly notificationStrategies: {
    readonly kind: 'collection';
    readonly baseType: 'NotificationStrategy';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/notifications/types.ts:NotificationStrategy';
    readonly members: readonly [
      {
        readonly contractName: 'NotificationStrategy';
        readonly registrationKey: 'notificationAddedToAlbumStrategy';
      },
      {
        readonly contractName: 'NotificationStrategy';
        readonly registrationKey: 'notificationAlbumSharedStrategy';
      },
      {
        readonly contractName: 'NotificationStrategy';
        readonly registrationKey: 'notificationCommentStrategy';
      },
      {
        readonly contractName: 'NotificationStrategy';
        readonly registrationKey: 'notificationGuestAlbumSharedStrategy';
      },
      {
        readonly contractName: 'NotificationStrategy';
        readonly registrationKey: 'notificationReactionStrategy';
      },
    ];
  };
  readonly notificationWriters: {
    readonly kind: 'object';
    readonly baseType: 'NotificationWriter';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/notifications/writers/inAppWriter.ts:NotificationWriter';
    readonly members: {
      readonly asyncWriter: {
        readonly contractName: 'AsyncWriter';
        readonly registrationKey: 'asyncWriter';
      };
      readonly inAppWriter: {
        readonly contractName: 'InAppWriter';
        readonly registrationKey: 'inAppWriter';
      };
    };
  };
  readonly publicReadServices: {
    readonly kind: 'object';
    readonly baseType: 'PublicReadServiceBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:PublicReadServiceBase';
    readonly members: {
      readonly publicAlbumReadService: {
        readonly contractName: 'PublicAlbumReadService';
        readonly registrationKey: 'publicAlbumReadService';
      };
      readonly publicMediaItemReadService: {
        readonly contractName: 'PublicMediaItemReadService';
        readonly registrationKey: 'publicMediaItemReadService';
      };
    };
  };
  readonly readServices: {
    readonly kind: 'object';
    readonly baseType: 'ReadServiceBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:ReadServiceBase';
    readonly members: {
      readonly viewerAlbumReadService: {
        readonly contractName: 'ViewerAlbumReadService';
        readonly registrationKey: 'viewerAlbumReadService';
      };
      readonly viewerAuthorizationsReadService: {
        readonly contractName: 'viewerAuthorizationsReadService';
        readonly registrationKey: 'viewerAuthorizationsReadService';
      };
      readonly viewerHasInAppNotificationService: {
        readonly contractName: 'ViewerHasInAppNotificationService';
        readonly registrationKey: 'viewerHasInAppNotificationService';
      };
      readonly viewerMediaItemReadService: {
        readonly contractName: 'ViewerMediaItemReadService';
        readonly registrationKey: 'viewerMediaItemReadService';
      };
      readonly viewerReactionReadService: {
        readonly contractName: 'viewerReactionReadService';
        readonly registrationKey: 'viewerReactionReadService';
      };
      readonly viewerSharedContactsReadService: {
        readonly contractName: 'ViewerSharedContactsReadService';
        readonly registrationKey: 'viewerSharedContactsReadService';
      };
      readonly viewerSharedWithMeAlbumReadService: {
        readonly contractName: 'ViewerSharedWithMeAlbumReadService';
        readonly registrationKey: 'viewerSharedWithMeAlbumReadService';
      };
    };
  };
  readonly writeServices: {
    readonly kind: 'object';
    readonly baseType: 'WriteServiceBase';
    readonly baseTypeId: '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/services/writeServices/writeServiceBaseType.ts:WriteServiceBase';
    readonly members: {
      readonly activatePendingUserWriteService: {
        readonly contractName: 'ActivatePendingUserWriteService';
        readonly registrationKey: 'activatePendingUserWriteService';
      };
      readonly addAlbumItem: {
        readonly contractName: 'AddAlbumItem';
        readonly registrationKey: 'addAlbumItem';
      };
      readonly addAlbumMembers: {
        readonly contractName: 'AddAlbumMembers';
        readonly registrationKey: 'addAlbumMembers';
      };
      readonly addComment: {
        readonly contractName: 'AddComment';
        readonly registrationKey: 'addComment';
      };
      readonly addMediaItemsToAlbum: {
        readonly contractName: 'AddMediaItemsToAlbum';
        readonly registrationKey: 'addMediaItemsToAlbum';
      };
      readonly createAlbum: {
        readonly contractName: 'CreateAlbum';
        readonly registrationKey: 'createAlbum';
      };
      readonly createEmailDeliveryService: {
        readonly contractName: 'CreateEmailDeliveryService';
        readonly registrationKey: 'createEmailDeliveryService';
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
      readonly createUserWriteService: {
        readonly contractName: 'CreateUserWriteService';
        readonly registrationKey: 'createUserWriteService';
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
      readonly deleteShareContactService: {
        readonly contractName: 'DeleteShareContactService';
        readonly registrationKey: 'deleteShareContactService';
      };
      readonly editComment: {
        readonly contractName: 'EditComment';
        readonly registrationKey: 'editComment';
      };
      readonly finalizeMediaItemUpload: {
        readonly contractName: 'FinalizeMediaItemUpload';
        readonly registrationKey: 'finalizeMediaItemUpload';
      };
      readonly grantUserAuthorization: {
        readonly contractName: 'GrantUserAuthorization';
        readonly registrationKey: 'grantUserAuthorization';
      };
      readonly markActivitySeen: {
        readonly contractName: 'MarkActivitySeen';
        readonly registrationKey: 'markActivitySeen';
      };
      readonly removeAlbumMembers: {
        readonly contractName: 'RemoveAlbumMembers';
        readonly registrationKey: 'removeAlbumMembers';
      };
      readonly reorderAlbumItems: {
        readonly contractName: 'ReorderAlbumItems';
        readonly registrationKey: 'reorderAlbumItems';
      };
      readonly revokePublicLinkService: {
        readonly contractName: 'RevokePublicLinkService';
        readonly registrationKey: 'revokePublicLinkService';
      };
      readonly revokeShareService: {
        readonly contractName: 'RevokeShareService';
        readonly registrationKey: 'revokeShareService';
      };
      readonly setCoverMedia: {
        readonly contractName: 'SetCoverMedia';
        readonly registrationKey: 'setCoverMedia';
      };
      readonly toggleReaction: {
        readonly contractName: 'ToggleReaction';
        readonly registrationKey: 'toggleReaction';
      };
      readonly unsetCoverMedia: {
        readonly contractName: 'UnsetCoverMedia';
        readonly registrationKey: 'unsetCoverMedia';
      };
      readonly updateAlbumMemberRoleService: {
        readonly contractName: 'UpdateAlbumMemberRoleService';
        readonly registrationKey: 'updateAlbumMemberRoleService';
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
    ioc_domain_Authorization_eventHandlers_authorizationReconciliation,
    ioc_domain_Authorization_eventHandlers_resolveAuthorizations,
    ioc_domain_domainEvents_eventPublisher,
    ioc_infrastructure_repositories_unitOfWork,
    ioc_notifications_dispatcher,
    ioc_notifications_strategies_notificationAlbumStrategies,
    ioc_notifications_strategies_notificationCommentStrategy,
    ioc_notifications_strategies_notificationReactionStrategy,
    ioc_notifications_writers_asyncWriter,
    ioc_notifications_writers_inAppWriter,
    ioc_repositories_domainRepositories_albumRepository,
    ioc_repositories_domainRepositories_commentRepository,
    ioc_repositories_domainRepositories_emailDeliverRepository,
    ioc_repositories_domainRepositories_emailVerificationRepository,
    ioc_repositories_domainRepositories_mediaItemRepository,
    ioc_repositories_domainRepositories_notificationRepository,
    ioc_repositories_domainRepositories_shareContactRepository,
    ioc_repositories_domainRepositories_userRepository,
    ioc_repositories_mediaDeletionJob_mediaDeletionJobRepository,
    ioc_repositories_mediaProcessingJob_mediaProcessingJobRepository,
    ioc_repositories_readRepositories_albumItemReadRepository,
    ioc_repositories_readRepositories_albumMemberReadRepository,
    ioc_repositories_readRepositories_albumReadRepository,
    ioc_repositories_readRepositories_authorizationReadRepository,
    ioc_repositories_readRepositories_commentReadRepository,
    ioc_repositories_readRepositories_grantReadRepository,
    ioc_repositories_readRepositories_inAppNotificationRepository,
    ioc_repositories_readRepositories_mediaItemReadRepository,
    ioc_repositories_readRepositories_publicAccessReadRepository,
    ioc_repositories_readRepositories_publicMediaItemReadRepository,
    ioc_repositories_readRepositories_reactionReadRepository,
    ioc_repositories_readRepositories_shareContactReadRepository,
    ioc_repositories_readRepositories_sharedWithMeReadRepository,
    ioc_repositories_readRepositories_userReadRepository,
    ioc_repositories_systemRepositories_systemAlbumItemRepository,
    ioc_repositories_systemRepositories_systemAlbumRepository,
    ioc_repositories_systemRepositories_systemAsyncNotificationRepository,
    ioc_repositories_systemRepositories_systemAuthorizationRepository,
    ioc_repositories_systemRepositories_systemCommentRepository,
    ioc_repositories_systemRepositories_systemEmailVerificationRepository,
    ioc_repositories_systemRepositories_systemGrantRepository,
    ioc_repositories_systemRepositories_systemInAppNotificationRepository,
    ioc_repositories_systemRepositories_systemMediaItemRepository,
    ioc_repositories_systemRepositories_systemUserRepository,
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
    ioc_services_readServices_viewerReadServices_viewerHasInAppNotificationService,
    ioc_services_readServices_viewerReadServices_viewerMediaItemReadService,
    ioc_services_readServices_viewerReadServices_viewerReactionReadService,
    ioc_services_readServices_viewerReadServices_viewerSharedContactsReadService,
    ioc_services_readServices_viewerReadServices_viewerSharedWithMeAlbumReadService,
    ioc_services_writeServices_album_addAlbumItem,
    ioc_services_writeServices_album_addAlbumMembers,
    ioc_services_writeServices_album_addMediaItemsToAlbum,
    ioc_services_writeServices_album_createAlbum,
    ioc_services_writeServices_album_deleteAlbum,
    ioc_services_writeServices_album_deleteAlbumItems,
    ioc_services_writeServices_album_removeAlbumMembers,
    ioc_services_writeServices_album_reorderAlbumItems,
    ioc_services_writeServices_album_revokePublicLinkService,
    ioc_services_writeServices_album_revokeShareService,
    ioc_services_writeServices_album_setCoverMedia,
    ioc_services_writeServices_album_unsetCoverMedia,
    ioc_services_writeServices_album_updateAlbumMemberRoleService,
    ioc_services_writeServices_authorization_deleteShareContactService,
    ioc_services_writeServices_authorization_grantAuthorizationForAlbum,
    ioc_services_writeServices_comments_addComment,
    ioc_services_writeServices_comments_deleteComment,
    ioc_services_writeServices_comments_editComment,
    ioc_services_writeServices_EmailDelivery_createEmailDeliveryService,
    ioc_services_writeServices_markActivitySeen,
    ioc_services_writeServices_mediaItem_createMediaItemUpload,
    ioc_services_writeServices_mediaItem_deleteMediaItem,
    ioc_services_writeServices_mediaItem_deleteMediaItems,
    ioc_services_writeServices_mediaItem_finalizeMediaItemUpload,
    ioc_services_writeServices_mediaItem_updateMediaItem,
    ioc_services_writeServices_mediaItem_updateMediaItemTags,
    ioc_services_writeServices_publicLink_createPublicLinkForAlbum,
    ioc_services_writeServices_publicLink_createPublicLinkForMediaItems,
    ioc_services_writeServices_reactions_toggleReaction,
    ioc_services_writeServices_user_activatePendingUserWriteService,
    ioc_services_writeServices_user_createUserWriteService,
  ] as const satisfies readonly IocModuleNamespace[],

  contracts: {
    ActivatePendingUserWriteService: {
      activatePendingUserWriteService: {
        exportName: 'build__ActivatePendingUserWriteService',
        registrationKey: 'activatePendingUserWriteService',
        modulePath: 'services/writeServices/user/activatePendingUserWriteService.ts',
        relImport: '../services/writeServices/user/activatePendingUserWriteService.js',
        contractName: 'ActivatePendingUserWriteService',
        implementationName: 'activatePendingUserWriteService',
        lifetime: 'scoped',
        moduleIndex: 89,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'UserRepository'],
      },
    },
    AddAlbumItem: {
      addAlbumItem: {
        exportName: 'build__AddAlbumItem',
        registrationKey: 'addAlbumItem',
        modulePath: 'services/writeServices/album/addAlbumItem.ts',
        relImport: '../services/writeServices/album/addAlbumItem.js',
        contractName: 'AddAlbumItem',
        implementationName: 'addAlbumItem',
        lifetime: 'scoped',
        moduleIndex: 60,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'MediaItemReadRepository'],
      },
    },
    AddAlbumMembers: {
      addAlbumMembers: {
        exportName: 'build__AddAlbumMembers',
        registrationKey: 'addAlbumMembers',
        modulePath: 'services/writeServices/album/addAlbumMembers.ts',
        relImport: '../services/writeServices/album/addAlbumMembers.js',
        contractName: 'AddAlbumMembers',
        implementationName: 'addAlbumMembers',
        lifetime: 'scoped',
        moduleIndex: 61,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'UserReadRepository'],
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
        lifetime: 'scoped',
        moduleIndex: 75,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'CommentRepository',
          'ToggleReaction',
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
        lifetime: 'scoped',
        moduleIndex: 62,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'MediaItemReadRepository'],
      },
    },
    AlbumItemReadRepository: {
      albumItemReadRepository: {
        exportName: 'build__AlbumItemReadRepository',
        registrationKey: 'albumItemReadRepository',
        modulePath: 'repositories/readRepositories/albumItemReadRepository.ts',
        relImport: '../repositories/readRepositories/albumItemReadRepository.js',
        contractName: 'AlbumItemReadRepository',
        implementationName: 'albumItemReadRepository',
        lifetime: 'singleton',
        moduleIndex: 21,
        default: true,
        discoveredBy: 'naming',
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
        moduleIndex: 22,
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
        moduleIndex: 23,
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
        lifetime: 'scoped',
        moduleIndex: 11,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UnitOfWork'],
      },
    },
    AsyncWriter: {
      asyncWriter: {
        exportName: 'build__AsyncWriter',
        registrationKey: 'asyncWriter',
        modulePath: 'notifications/writers/asyncWriter.ts',
        relImport: '../notifications/writers/asyncWriter.js',
        contractName: 'AsyncWriter',
        implementationName: 'asyncWriter',
        lifetime: 'singleton',
        moduleIndex: 9,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['SystemAsyncNotificationRepository'],
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
        moduleIndex: 24,
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
        moduleIndex: 25,
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
        moduleIndex: 45,
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
        lifetime: 'scoped',
        moduleIndex: 12,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UnitOfWork'],
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
        lifetime: 'scoped',
        moduleIndex: 63,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    CreateEmailDeliveryService: {
      createEmailDeliveryService: {
        exportName: 'build__CreateEmailDeliveryService',
        registrationKey: 'createEmailDeliveryService',
        modulePath: 'services/writeServices/EmailDelivery/createEmailDeliveryService.ts',
        relImport: '../services/writeServices/EmailDelivery/createEmailDeliveryService.js',
        contractName: 'CreateEmailDeliveryService',
        implementationName: 'createEmailDeliveryService',
        lifetime: 'scoped',
        moduleIndex: 78,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['EmailDeliveryRepository'],
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
        lifetime: 'scoped',
        moduleIndex: 80,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'MediaItemRepository', 'MediaStorage'],
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
        lifetime: 'scoped',
        moduleIndex: 86,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
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
        lifetime: 'scoped',
        moduleIndex: 87,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumRepository',
          'CreatePublicLinkForAlbum',
          'MediaItemRepository',
        ],
      },
    },
    CreateUserWriteService: {
      createUserWriteService: {
        exportName: 'build__CreateUserWriteService',
        registrationKey: 'createUserWriteService',
        modulePath: 'services/writeServices/user/createUserWriteService.ts',
        relImport: '../services/writeServices/user/createUserWriteService.js',
        contractName: 'CreateUserWriteService',
        implementationName: 'createUserWriteService',
        lifetime: 'scoped',
        moduleIndex: 90,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UserRepository'],
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
        lifetime: 'scoped',
        moduleIndex: 64,
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
        lifetime: 'scoped',
        moduleIndex: 65,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'SystemAlbumItemRepository'],
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
        lifetime: 'scoped',
        moduleIndex: 76,
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
        lifetime: 'scoped',
        moduleIndex: 81,
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
        lifetime: 'scoped',
        moduleIndex: 82,
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
    DeleteShareContactService: {
      deleteShareContactService: {
        exportName: 'build__DeleteShareContactService',
        registrationKey: 'deleteShareContactService',
        modulePath: 'services/writeServices/authorization/deleteShareContactService.ts',
        relImport: '../services/writeServices/authorization/deleteShareContactService.js',
        contractName: 'DeleteShareContactService',
        implementationName: 'deleteShareContactService',
        lifetime: 'scoped',
        moduleIndex: 73,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['ShareContactRepository'],
      },
    },
    DomainEventHandler: {
      authorizationReconciliation: {
        exportName: 'build__AuthorizationReconciliation',
        registrationKey: 'authorizationReconciliation',
        modulePath: 'domain/Authorization/eventHandlers/authorizationReconciliation.ts',
        relImport: '../domain/Authorization/eventHandlers/authorizationReconciliation.js',
        contractName: 'DomainEventHandler',
        implementationName: 'authorizationReconciliation',
        lifetime: 'singleton',
        moduleIndex: 1,
        discoveredBy: 'naming',
        dependencyContractNames: ['ResolveAuthorizations', 'SystemGrantRepository'],
      },
      notificationDispatcher: {
        exportName: 'build__NotificationDispatcher',
        registrationKey: 'notificationDispatcher',
        modulePath: 'notifications/dispatcher.ts',
        relImport: '../notifications/dispatcher.js',
        contractName: 'DomainEventHandler',
        implementationName: 'notificationDispatcher',
        lifetime: 'singleton',
        moduleIndex: 5,
        discoveredBy: 'naming',
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
        lifetime: 'scoped',
        moduleIndex: 77,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['CommentRepository'],
      },
    },
    EmailDeliveryRepository: {
      emailDeliveryRepository: {
        exportName: 'build__EmailDeliveryRepository',
        registrationKey: 'emailDeliveryRepository',
        modulePath: 'repositories/domainRepositories/emailDeliverRepository.ts',
        relImport: '../repositories/domainRepositories/emailDeliverRepository.js',
        contractName: 'EmailDeliveryRepository',
        implementationName: 'emailDeliveryRepository',
        lifetime: 'scoped',
        moduleIndex: 13,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UnitOfWork'],
      },
    },
    EmailVerificationRepository: {
      emailVerificationRepository: {
        exportName: 'build__EmailVerificationRepository',
        registrationKey: 'emailVerificationRepository',
        modulePath: 'repositories/domainRepositories/emailVerificationRepository.ts',
        relImport: '../repositories/domainRepositories/emailVerificationRepository.js',
        contractName: 'EmailVerificationRepository',
        implementationName: 'emailVerificationRepository',
        lifetime: 'scoped',
        moduleIndex: 14,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UnitOfWork'],
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
        moduleIndex: 52,
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
    EventPublisher: {
      eventPublisher: {
        exportName: 'build__EventPublisher',
        registrationKey: 'eventPublisher',
        modulePath: 'domain/domainEvents/eventPublisher.ts',
        relImport: '../domain/domainEvents/eventPublisher.js',
        contractName: 'EventPublisher',
        implementationName: 'eventPublisher',
        lifetime: 'singleton',
        moduleIndex: 3,
        default: true,
        discoveredBy: 'naming',
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
        lifetime: 'scoped',
        moduleIndex: 83,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'MediaItemRepository',
          'MediaProcessingJobRepository',
          'MediaStorage',
          'UnitOfWork',
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
        moduleIndex: 26,
        default: true,
        discoveredBy: 'naming',
      },
    },
    GrantUserAuthorization: {
      grantUserAuthorization: {
        exportName: 'build__GrantUserAuthorization',
        registrationKey: 'grantUserAuthorization',
        modulePath: 'services/writeServices/authorization/grantAuthorizationForAlbum.ts',
        relImport: '../services/writeServices/authorization/grantAuthorizationForAlbum.js',
        contractName: 'GrantUserAuthorization',
        implementationName: 'grantUserAuthorization',
        lifetime: 'scoped',
        moduleIndex: 74,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumRepository',
          'CreateUserWriteService',
          'MediaItemRepository',
          'ShareContactRepository',
          'UserRepository',
        ],
      },
    },
    InAppNotificationRepository: {
      inAppNotificationRepository: {
        exportName: 'build__InAppNotificationRepository',
        registrationKey: 'inAppNotificationRepository',
        modulePath: 'repositories/readRepositories/inAppNotificationRepository.ts',
        relImport: '../repositories/readRepositories/inAppNotificationRepository.js',
        contractName: 'InAppNotificationRepository',
        implementationName: 'inAppNotificationRepository',
        lifetime: 'singleton',
        moduleIndex: 27,
        default: true,
        discoveredBy: 'naming',
      },
    },
    InAppWriter: {
      inAppWriter: {
        exportName: 'build__InAppWriter',
        registrationKey: 'inAppWriter',
        modulePath: 'notifications/writers/inAppWriter.ts',
        relImport: '../notifications/writers/inAppWriter.js',
        contractName: 'InAppWriter',
        implementationName: 'inAppWriter',
        lifetime: 'singleton',
        moduleIndex: 10,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['SystemInAppNotificationRepository', 'SystemMediaItemRepository'],
      },
    },
    MarkActivitySeen: {
      markActivitySeen: {
        exportName: 'build__MarkActivitySeen',
        registrationKey: 'markActivitySeen',
        modulePath: 'services/writeServices/markActivitySeen.ts',
        relImport: '../services/writeServices/markActivitySeen.js',
        contractName: 'MarkActivitySeen',
        implementationName: 'markActivitySeen',
        lifetime: 'scoped',
        moduleIndex: 79,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['InAppNotificationRepository'],
      },
    },
    MediaDeletionJobRepository: {
      mediaDeletionJobRepository: {
        exportName: 'build__MediaDeletionJobRepository',
        registrationKey: 'mediaDeletionJobRepository',
        modulePath: 'repositories/mediaDeletionJob/mediaDeletionJobRepository.ts',
        relImport: '../repositories/mediaDeletionJob/mediaDeletionJobRepository.js',
        contractName: 'MediaDeletionJobRepository',
        implementationName: 'mediaDeletionJobRepository',
        lifetime: 'singleton',
        moduleIndex: 19,
        default: true,
        discoveredBy: 'naming',
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
        moduleIndex: 47,
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
        moduleIndex: 28,
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
        lifetime: 'scoped',
        moduleIndex: 15,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UnitOfWork'],
      },
    },
    MediaProcessingJobRepository: {
      mediaProcessingJobRepository: {
        exportName: 'build__MediaProcessingJobRepository',
        registrationKey: 'mediaProcessingJobRepository',
        modulePath: 'repositories/mediaProcessingJob/mediaProcessingJobRepository.ts',
        relImport: '../repositories/mediaProcessingJob/mediaProcessingJobRepository.js',
        contractName: 'MediaProcessingJobRepository',
        implementationName: 'mediaProcessingJobRepository',
        lifetime: 'singleton',
        moduleIndex: 20,
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
        lifetime: 'scoped',
        moduleIndex: 16,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UnitOfWork'],
      },
    },
    NotificationStrategy: {
      notificationAddedToAlbumStrategy: {
        exportName: 'build__NotificationAddedToAlbumStrategy',
        registrationKey: 'notificationAddedToAlbumStrategy',
        modulePath: 'notifications/strategies/notificationAlbumStrategies.ts',
        relImport: '../notifications/strategies/notificationAlbumStrategies.js',
        contractName: 'NotificationStrategy',
        implementationName: 'notificationAddedToAlbumStrategy',
        lifetime: 'singleton',
        moduleIndex: 6,
        discoveredBy: 'naming',
        dependencyContractNames: ['SystemAuthorizationRepository', 'SystemUserRepository'],
      },
      notificationAlbumSharedStrategy: {
        exportName: 'build__NotificationAlbumSharedStrategy',
        registrationKey: 'notificationAlbumSharedStrategy',
        modulePath: 'notifications/strategies/notificationAlbumStrategies.ts',
        relImport: '../notifications/strategies/notificationAlbumStrategies.js',
        contractName: 'NotificationStrategy',
        implementationName: 'notificationAlbumSharedStrategy',
        lifetime: 'singleton',
        moduleIndex: 6,
        discoveredBy: 'naming',
        dependencyContractNames: ['SystemUserRepository'],
      },
      notificationCommentStrategy: {
        exportName: 'build__NotificationCommentStrategy',
        registrationKey: 'notificationCommentStrategy',
        modulePath: 'notifications/strategies/notificationCommentStrategy.ts',
        relImport: '../notifications/strategies/notificationCommentStrategy.js',
        contractName: 'NotificationStrategy',
        implementationName: 'notificationCommentStrategy',
        lifetime: 'singleton',
        moduleIndex: 7,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'SystemCommentRepository',
          'SystemMediaItemRepository',
          'SystemUserRepository',
        ],
      },
      notificationGuestAlbumSharedStrategy: {
        exportName: 'build__NotificationGuestAlbumSharedStrategy',
        registrationKey: 'notificationGuestAlbumSharedStrategy',
        modulePath: 'notifications/strategies/notificationAlbumStrategies.ts',
        relImport: '../notifications/strategies/notificationAlbumStrategies.js',
        contractName: 'NotificationStrategy',
        implementationName: 'notificationGuestAlbumSharedStrategy',
        lifetime: 'singleton',
        moduleIndex: 6,
        discoveredBy: 'naming',
        dependencyContractNames: ['SystemUserRepository'],
      },
      notificationReactionStrategy: {
        exportName: 'build__NotificationReactionStrategy',
        registrationKey: 'notificationReactionStrategy',
        modulePath: 'notifications/strategies/notificationReactionStrategy.ts',
        relImport: '../notifications/strategies/notificationReactionStrategy.js',
        contractName: 'NotificationStrategy',
        implementationName: 'notificationReactionStrategy',
        lifetime: 'singleton',
        moduleIndex: 8,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'SystemCommentRepository',
          'SystemMediaItemRepository',
          'SystemUserRepository',
        ],
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
        moduleIndex: 29,
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
        moduleIndex: 48,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['PublicAccessReadRepository'],
      },
    },
    PublicAlbumReadService: {
      publicAlbumReadService: {
        exportName: 'build__PublicAlbumReadService',
        registrationKey: 'publicAlbumReadService',
        modulePath: 'services/readServices/publicReadServices/publicAlbumReadService.ts',
        relImport: '../services/readServices/publicReadServices/publicAlbumReadService.js',
        contractName: 'PublicAlbumReadService',
        implementationName: 'publicAlbumReadService',
        lifetime: 'scoped',
        moduleIndex: 49,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumItemReadRepository',
          'AlbumReadRepository',
          'EnrichMediaItems',
        ],
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
        moduleIndex: 30,
        default: true,
        discoveredBy: 'naming',
      },
    },
    PublicMediaItemReadService: {
      publicMediaItemReadService: {
        exportName: 'build__PublicMediaItemReadService',
        registrationKey: 'publicMediaItemReadService',
        modulePath: 'services/readServices/publicReadServices/publicMediaItemReadService.ts',
        relImport: '../services/readServices/publicReadServices/publicMediaItemReadService.js',
        contractName: 'PublicMediaItemReadService',
        implementationName: 'publicMediaItemReadService',
        lifetime: 'scoped',
        moduleIndex: 50,
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
        moduleIndex: 31,
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
        moduleIndex: 51,
        default: true,
        discoveredBy: 'naming',
      },
    },
    RemoveAlbumMembers: {
      removeAlbumMembers: {
        exportName: 'build__RemoveAlbumMembers',
        registrationKey: 'removeAlbumMembers',
        modulePath: 'services/writeServices/album/removeAlbumMembers.ts',
        relImport: '../services/writeServices/album/removeAlbumMembers.js',
        contractName: 'RemoveAlbumMembers',
        implementationName: 'removeAlbumMembers',
        lifetime: 'scoped',
        moduleIndex: 66,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
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
        lifetime: 'scoped',
        moduleIndex: 67,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    ResolveAuthorizations: {
      resolveAuthorizations: {
        exportName: 'build__ResolveAuthorizations',
        registrationKey: 'resolveAuthorizations',
        modulePath: 'domain/Authorization/eventHandlers/resolveAuthorizations.ts',
        relImport: '../domain/Authorization/eventHandlers/resolveAuthorizations.js',
        contractName: 'ResolveAuthorizations',
        implementationName: 'resolveAuthorizations',
        lifetime: 'singleton',
        moduleIndex: 2,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'SystemAlbumItemRepository',
          'SystemAuthorizationRepository',
          'SystemUserRepository',
        ],
      },
    },
    RevokePublicLinkService: {
      revokePublicLinkService: {
        exportName: 'build__RevokePublicLinkService',
        registrationKey: 'revokePublicLinkService',
        modulePath: 'services/writeServices/album/revokePublicLinkService.ts',
        relImport: '../services/writeServices/album/revokePublicLinkService.js',
        contractName: 'RevokePublicLinkService',
        implementationName: 'revokePublicLinkService',
        lifetime: 'scoped',
        moduleIndex: 68,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'SystemGrantRepository', 'UnitOfWork'],
      },
    },
    RevokeShareService: {
      revokeShareService: {
        exportName: 'build__RevokeShareService',
        registrationKey: 'revokeShareService',
        modulePath: 'services/writeServices/album/revokeShareService.ts',
        relImport: '../services/writeServices/album/revokeShareService.js',
        contractName: 'RevokeShareService',
        implementationName: 'revokeShareService',
        lifetime: 'scoped',
        moduleIndex: 69,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository', 'SystemGrantRepository', 'UnitOfWork'],
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
        lifetime: 'scoped',
        moduleIndex: 70,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    ShareContactReadRepository: {
      shareContactReadRepository: {
        exportName: 'build__ShareContactReadRepository',
        registrationKey: 'shareContactReadRepository',
        modulePath: 'repositories/readRepositories/shareContactReadRepository.ts',
        relImport: '../repositories/readRepositories/shareContactReadRepository.js',
        contractName: 'ShareContactReadRepository',
        implementationName: 'shareContactReadRepository',
        lifetime: 'singleton',
        moduleIndex: 32,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ShareContactRepository: {
      shareContactRepository: {
        exportName: 'build__ShareContactRepository',
        registrationKey: 'shareContactRepository',
        modulePath: 'repositories/domainRepositories/shareContactRepository.ts',
        relImport: '../repositories/domainRepositories/shareContactRepository.js',
        contractName: 'ShareContactRepository',
        implementationName: 'shareContactRepository',
        lifetime: 'scoped',
        moduleIndex: 17,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UnitOfWork'],
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
        moduleIndex: 33,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemAlbumItemRepository: {
      systemAlbumItemRepository: {
        exportName: 'build__SystemAlbumItemRepository',
        registrationKey: 'systemAlbumItemRepository',
        modulePath: 'repositories/systemRepositories/systemAlbumItemRepository.ts',
        relImport: '../repositories/systemRepositories/systemAlbumItemRepository.js',
        contractName: 'SystemAlbumItemRepository',
        implementationName: 'systemAlbumItemRepository',
        lifetime: 'singleton',
        moduleIndex: 35,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemAlbumRepository: {
      systemAlbumRepository: {
        exportName: 'build__SystemAlbumRepository',
        registrationKey: 'systemAlbumRepository',
        modulePath: 'repositories/systemRepositories/systemAlbumRepository.ts',
        relImport: '../repositories/systemRepositories/systemAlbumRepository.js',
        contractName: 'SystemAlbumRepository',
        implementationName: 'systemAlbumRepository',
        lifetime: 'singleton',
        moduleIndex: 36,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemAsyncNotificationRepository: {
      systemAsyncNotificationRepository: {
        exportName: 'build__SystemAsyncNotificationRepository',
        registrationKey: 'systemAsyncNotificationRepository',
        modulePath: 'repositories/systemRepositories/systemAsyncNotificationRepository.ts',
        relImport: '../repositories/systemRepositories/systemAsyncNotificationRepository.js',
        contractName: 'SystemAsyncNotificationRepository',
        implementationName: 'systemAsyncNotificationRepository',
        lifetime: 'singleton',
        moduleIndex: 37,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemAuthorizationRepository: {
      systemAuthorizationRepository: {
        exportName: 'build__SystemAuthorizationRepository',
        registrationKey: 'systemAuthorizationRepository',
        modulePath: 'repositories/systemRepositories/systemAuthorizationRepository.ts',
        relImport: '../repositories/systemRepositories/systemAuthorizationRepository.js',
        contractName: 'SystemAuthorizationRepository',
        implementationName: 'systemAuthorizationRepository',
        lifetime: 'singleton',
        moduleIndex: 38,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemCommentRepository: {
      systemCommentRepository: {
        exportName: 'build__systemCommentRepository',
        registrationKey: 'systemCommentRepository',
        modulePath: 'repositories/systemRepositories/systemCommentRepository.ts',
        relImport: '../repositories/systemRepositories/systemCommentRepository.js',
        contractName: 'SystemCommentRepository',
        implementationName: 'systemCommentRepository',
        lifetime: 'singleton',
        moduleIndex: 39,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemEmailVerificationRepository: {
      systemEmailVerificationRepository: {
        exportName: 'build__SystemEmailVerificationRepository',
        registrationKey: 'systemEmailVerificationRepository',
        modulePath: 'repositories/systemRepositories/systemEmailVerificationRepository.ts',
        relImport: '../repositories/systemRepositories/systemEmailVerificationRepository.js',
        contractName: 'SystemEmailVerificationRepository',
        implementationName: 'systemEmailVerificationRepository',
        lifetime: 'singleton',
        moduleIndex: 40,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemGrantRepository: {
      systemGrantRepository: {
        exportName: 'build__SystemGrantRepository',
        registrationKey: 'systemGrantRepository',
        modulePath: 'repositories/systemRepositories/systemGrantRepository.ts',
        relImport: '../repositories/systemRepositories/systemGrantRepository.js',
        contractName: 'SystemGrantRepository',
        implementationName: 'systemGrantRepository',
        lifetime: 'singleton',
        moduleIndex: 41,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemInAppNotificationRepository: {
      systemInAppNotificationRepository: {
        exportName: 'build__SystemInAppNotificationRepository',
        registrationKey: 'systemInAppNotificationRepository',
        modulePath: 'repositories/systemRepositories/systemInAppNotificationRepository.ts',
        relImport: '../repositories/systemRepositories/systemInAppNotificationRepository.js',
        contractName: 'SystemInAppNotificationRepository',
        implementationName: 'systemInAppNotificationRepository',
        lifetime: 'singleton',
        moduleIndex: 42,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemMediaItemRepository: {
      systemMediaItemRepository: {
        exportName: 'build__SystemMediaItemRepository',
        registrationKey: 'systemMediaItemRepository',
        modulePath: 'repositories/systemRepositories/systemMediaItemRepository.ts',
        relImport: '../repositories/systemRepositories/systemMediaItemRepository.js',
        contractName: 'SystemMediaItemRepository',
        implementationName: 'systemMediaItemRepository',
        lifetime: 'singleton',
        moduleIndex: 43,
        default: true,
        discoveredBy: 'naming',
      },
    },
    SystemUserRepository: {
      systemUserRepository: {
        exportName: 'build__SystemUserRepository',
        registrationKey: 'systemUserRepository',
        modulePath: 'repositories/systemRepositories/systemUserRepository.ts',
        relImport: '../repositories/systemRepositories/systemUserRepository.js',
        contractName: 'SystemUserRepository',
        implementationName: 'systemUserRepository',
        lifetime: 'singleton',
        moduleIndex: 44,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ToggleReaction: {
      toggleReaction: {
        exportName: 'build__ToggleReaction',
        registrationKey: 'toggleReaction',
        modulePath: 'services/writeServices/reactions/toggleReaction.ts',
        relImport: '../services/writeServices/reactions/toggleReaction.js',
        contractName: 'ToggleReaction',
        implementationName: 'toggleReaction',
        lifetime: 'scoped',
        moduleIndex: 88,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['CommentRepository', 'MediaItemRepository'],
      },
    },
    UnitOfWork: {
      unitOfWork: {
        exportName: 'build__UnitOfWork',
        registrationKey: 'unitOfWork',
        modulePath: 'infrastructure/repositories/unitOfWork.ts',
        relImport: '../infrastructure/repositories/unitOfWork.js',
        contractName: 'UnitOfWork',
        implementationName: 'unitOfWork',
        lifetime: 'transient',
        moduleIndex: 4,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['EventPublisher'],
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
        lifetime: 'scoped',
        moduleIndex: 71,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
      },
    },
    UpdateAlbumMemberRoleService: {
      updateAlbumMemberRoleService: {
        exportName: 'build__UpdateAlbumMemberRoleService',
        registrationKey: 'updateAlbumMemberRoleService',
        modulePath: 'services/writeServices/album/updateAlbumMemberRoleService.ts',
        relImport: '../services/writeServices/album/updateAlbumMemberRoleService.js',
        contractName: 'UpdateAlbumMemberRoleService',
        implementationName: 'updateAlbumMemberRoleService',
        lifetime: 'scoped',
        moduleIndex: 72,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AlbumRepository'],
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
        lifetime: 'scoped',
        moduleIndex: 84,
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
        lifetime: 'scoped',
        moduleIndex: 85,
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
        moduleIndex: 34,
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
        lifetime: 'scoped',
        moduleIndex: 18,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['UnitOfWork'],
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
        moduleIndex: 46,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumMemberReadRepository',
          'GrantReadRepository',
          'MediaItemReadRepository',
        ],
      },
    },
    ViewerAlbumReadService: {
      viewerAlbumReadService: {
        exportName: 'build__ViewerAlbumReadService',
        registrationKey: 'viewerAlbumReadService',
        modulePath: 'services/readServices/viewerReadServices/viewerAlbumReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerAlbumReadService.js',
        contractName: 'ViewerAlbumReadService',
        implementationName: 'viewerAlbumReadService',
        lifetime: 'scoped',
        moduleIndex: 53,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AlbumItemReadRepository',
          'AlbumMemberReadRepository',
          'AlbumReadRepository',
          'EnrichMediaItems',
          'UserReadRepository',
        ],
      },
    },
    viewerAuthorizationsReadService: {
      viewerAuthorizationsReadService: {
        exportName: 'build__viewerAuthorizationsReadService',
        registrationKey: 'viewerAuthorizationsReadService',
        modulePath: 'services/readServices/viewerReadServices/viewerAuthorizationsReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerAuthorizationsReadService.js',
        contractName: 'viewerAuthorizationsReadService',
        implementationName: 'viewerAuthorizationsReadService',
        lifetime: 'scoped',
        moduleIndex: 54,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AuthorizationReadRepository'],
      },
    },
    ViewerHasInAppNotificationService: {
      viewerHasInAppNotificationService: {
        exportName: 'build__ViewerHasInAppNotificationService',
        registrationKey: 'viewerHasInAppNotificationService',
        modulePath: 'services/readServices/viewerReadServices/viewerHasInAppNotificationService.ts',
        relImport:
          '../services/readServices/viewerReadServices/viewerHasInAppNotificationService.js',
        contractName: 'ViewerHasInAppNotificationService',
        implementationName: 'viewerHasInAppNotificationService',
        lifetime: 'scoped',
        moduleIndex: 55,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['InAppNotificationRepository'],
      },
    },
    ViewerMediaItemReadService: {
      viewerMediaItemReadService: {
        exportName: 'build__ViewerMediaItemReadService',
        registrationKey: 'viewerMediaItemReadService',
        modulePath: 'services/readServices/viewerReadServices/viewerMediaItemReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerMediaItemReadService.js',
        contractName: 'ViewerMediaItemReadService',
        implementationName: 'viewerMediaItemReadService',
        lifetime: 'scoped',
        moduleIndex: 56,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['EnrichMediaItems', 'MediaItemReadRepository'],
      },
    },
    viewerReactionReadService: {
      viewerReactionReadService: {
        exportName: 'build__viewerReactionReadService',
        registrationKey: 'viewerReactionReadService',
        modulePath: 'services/readServices/viewerReadServices/viewerReactionReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerReactionReadService.js',
        contractName: 'viewerReactionReadService',
        implementationName: 'viewerReactionReadService',
        lifetime: 'scoped',
        moduleIndex: 57,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['ReactionReadRepository'],
      },
    },
    ViewerSharedContactsReadService: {
      viewerSharedContactsReadService: {
        exportName: 'build__ViewerSharedContactsReadService',
        registrationKey: 'viewerSharedContactsReadService',
        modulePath: 'services/readServices/viewerReadServices/viewerSharedContactsReadService.ts',
        relImport: '../services/readServices/viewerReadServices/viewerSharedContactsReadService.js',
        contractName: 'ViewerSharedContactsReadService',
        implementationName: 'viewerSharedContactsReadService',
        lifetime: 'scoped',
        moduleIndex: 58,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['ShareContactReadRepository'],
      },
    },
    ViewerSharedWithMeAlbumReadService: {
      viewerSharedWithMeAlbumReadService: {
        exportName: 'build__ViewerSharedWithMeAlbumReadService',
        registrationKey: 'viewerSharedWithMeAlbumReadService',
        modulePath:
          'services/readServices/viewerReadServices/viewerSharedWithMeAlbumReadService.ts',
        relImport:
          '../services/readServices/viewerReadServices/viewerSharedWithMeAlbumReadService.js',
        contractName: 'ViewerSharedWithMeAlbumReadService',
        implementationName: 'viewerSharedWithMeAlbumReadService',
        lifetime: 'scoped',
        moduleIndex: 59,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['SharedWithMeReadRepository'],
      },
    },
  },
  // agnosticReadServices
  agnosticReadServices: {
    kind: 'object',
    baseType: 'AgnosticReadServiceBase',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:AgnosticReadServiceBase',
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

  // domainEventHandlers
  domainEventHandlers: {
    kind: 'collection',
    baseType: 'DomainEventHandler',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/domain/domainEvents/eventPublisher.ts:DomainEventHandler',
    members: [
      {
        contractName: 'DomainEventHandler',
        registrationKey: 'authorizationReconciliation',
      },
      {
        contractName: 'DomainEventHandler',
        registrationKey: 'notificationDispatcher',
      },
    ],
  },

  // notificationStrategies
  notificationStrategies: {
    kind: 'collection',
    baseType: 'NotificationStrategy',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/notifications/types.ts:NotificationStrategy',
    members: [
      {
        contractName: 'NotificationStrategy',
        registrationKey: 'notificationAddedToAlbumStrategy',
      },
      {
        contractName: 'NotificationStrategy',
        registrationKey: 'notificationAlbumSharedStrategy',
      },
      {
        contractName: 'NotificationStrategy',
        registrationKey: 'notificationCommentStrategy',
      },
      {
        contractName: 'NotificationStrategy',
        registrationKey: 'notificationGuestAlbumSharedStrategy',
      },
      {
        contractName: 'NotificationStrategy',
        registrationKey: 'notificationReactionStrategy',
      },
    ],
  },

  // notificationWriters
  notificationWriters: {
    kind: 'object',
    baseType: 'NotificationWriter',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/notifications/writers/inAppWriter.ts:NotificationWriter',
    members: {
      asyncWriter: {
        contractName: 'AsyncWriter',
        registrationKey: 'asyncWriter',
      },
      inAppWriter: {
        contractName: 'InAppWriter',
        registrationKey: 'inAppWriter',
      },
    },
  },

  // publicReadServices
  publicReadServices: {
    kind: 'object',
    baseType: 'PublicReadServiceBase',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:PublicReadServiceBase',
    members: {
      publicAlbumReadService: {
        contractName: 'PublicAlbumReadService',
        registrationKey: 'publicAlbumReadService',
      },
      publicMediaItemReadService: {
        contractName: 'PublicMediaItemReadService',
        registrationKey: 'publicMediaItemReadService',
      },
    },
  },

  // readServices
  readServices: {
    kind: 'object',
    baseType: 'ReadServiceBase',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/services/readServices/readServiceBaseType.ts:ReadServiceBase',
    members: {
      viewerAlbumReadService: {
        contractName: 'ViewerAlbumReadService',
        registrationKey: 'viewerAlbumReadService',
      },
      viewerAuthorizationsReadService: {
        contractName: 'viewerAuthorizationsReadService',
        registrationKey: 'viewerAuthorizationsReadService',
      },
      viewerHasInAppNotificationService: {
        contractName: 'ViewerHasInAppNotificationService',
        registrationKey: 'viewerHasInAppNotificationService',
      },
      viewerMediaItemReadService: {
        contractName: 'ViewerMediaItemReadService',
        registrationKey: 'viewerMediaItemReadService',
      },
      viewerReactionReadService: {
        contractName: 'viewerReactionReadService',
        registrationKey: 'viewerReactionReadService',
      },
      viewerSharedContactsReadService: {
        contractName: 'ViewerSharedContactsReadService',
        registrationKey: 'viewerSharedContactsReadService',
      },
      viewerSharedWithMeAlbumReadService: {
        contractName: 'ViewerSharedWithMeAlbumReadService',
        registrationKey: 'viewerSharedWithMeAlbumReadService',
      },
    },
  },

  // writeServices
  writeServices: {
    kind: 'object',
    baseType: 'WriteServiceBase',
    baseTypeId:
      '/home/reharik/Development/photoapp-cc/packages/context/media-core/src/services/writeServices/writeServiceBaseType.ts:WriteServiceBase',
    members: {
      activatePendingUserWriteService: {
        contractName: 'ActivatePendingUserWriteService',
        registrationKey: 'activatePendingUserWriteService',
      },
      addAlbumItem: {
        contractName: 'AddAlbumItem',
        registrationKey: 'addAlbumItem',
      },
      addAlbumMembers: {
        contractName: 'AddAlbumMembers',
        registrationKey: 'addAlbumMembers',
      },
      addComment: {
        contractName: 'AddComment',
        registrationKey: 'addComment',
      },
      addMediaItemsToAlbum: {
        contractName: 'AddMediaItemsToAlbum',
        registrationKey: 'addMediaItemsToAlbum',
      },
      createAlbum: {
        contractName: 'CreateAlbum',
        registrationKey: 'createAlbum',
      },
      createEmailDeliveryService: {
        contractName: 'CreateEmailDeliveryService',
        registrationKey: 'createEmailDeliveryService',
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
      createUserWriteService: {
        contractName: 'CreateUserWriteService',
        registrationKey: 'createUserWriteService',
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
      deleteShareContactService: {
        contractName: 'DeleteShareContactService',
        registrationKey: 'deleteShareContactService',
      },
      editComment: {
        contractName: 'EditComment',
        registrationKey: 'editComment',
      },
      finalizeMediaItemUpload: {
        contractName: 'FinalizeMediaItemUpload',
        registrationKey: 'finalizeMediaItemUpload',
      },
      grantUserAuthorization: {
        contractName: 'GrantUserAuthorization',
        registrationKey: 'grantUserAuthorization',
      },
      markActivitySeen: {
        contractName: 'MarkActivitySeen',
        registrationKey: 'markActivitySeen',
      },
      removeAlbumMembers: {
        contractName: 'RemoveAlbumMembers',
        registrationKey: 'removeAlbumMembers',
      },
      reorderAlbumItems: {
        contractName: 'ReorderAlbumItems',
        registrationKey: 'reorderAlbumItems',
      },
      revokePublicLinkService: {
        contractName: 'RevokePublicLinkService',
        registrationKey: 'revokePublicLinkService',
      },
      revokeShareService: {
        contractName: 'RevokeShareService',
        registrationKey: 'revokeShareService',
      },
      setCoverMedia: {
        contractName: 'SetCoverMedia',
        registrationKey: 'setCoverMedia',
      },
      toggleReaction: {
        contractName: 'ToggleReaction',
        registrationKey: 'toggleReaction',
      },
      unsetCoverMedia: {
        contractName: 'UnsetCoverMedia',
        registrationKey: 'unsetCoverMedia',
      },
      updateAlbumMemberRoleService: {
        contractName: 'UpdateAlbumMemberRoleService',
        registrationKey: 'updateAlbumMemberRoleService',
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

export const IOC_SCOPE_PROVIDED_KEYS = ['publicLinkId', 'uow', 'viewerId'] as const;
