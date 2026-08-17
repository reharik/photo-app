/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { Logger, RateLimiter } from '@packages/infrastructure';
import type { Knex } from 'knex';
import type { MediaStorage } from '../application/media/MediaStorage.js';
import type { MediaStorageConfig } from '../application/media/s3MediaStorage.js';
import type { ResolveAuthorizations } from '../domain/Authorization/eventHandlers/resolveAuthorizations.js';
import type { DomainEventHandler, EventPublisher } from '../domain/domainEvents/eventPublisher.js';
import type { UnitOfWork } from '../infrastructure/repositories/unitOfWork.js';
import type { NotificationStrategy } from '../notifications/types.js';
import type { AsyncWriter } from '../notifications/writers/asyncWriter.js';
import type { InAppWriter } from '../notifications/writers/inAppWriter.js';
import type { AlbumRepository } from '../repositories/domainRepositories/albumRepository.js';
import type { CommentRepository } from '../repositories/domainRepositories/commentRepository.js';
import type { EmailVerificationRepository } from '../repositories/domainRepositories/emailVerificationRepository.js';
import type { MediaItemRepository } from '../repositories/domainRepositories/mediaItemRepository.js';
import type { NotificationRepository } from '../repositories/domainRepositories/notificationRepository.js';
import type { ShareContactRepository } from '../repositories/domainRepositories/shareContactRepository.js';
import type { UserRepository } from '../repositories/domainRepositories/userRepository.js';
import type { MediaDeletionJobRepository } from '../repositories/mediaDeletionJob/mediaDeletionJobRepository.js';
import type { MediaProcessingJobRepository } from '../repositories/mediaProcessingJob/mediaProcessingJobRepository.js';
import type { AlbumItemReadRepository } from '../repositories/readRepositories/albumItemReadRepository.js';
import type { InAppNotificationRepository } from '../repositories/readRepositories/inAppNotificationRepository.js';
import type { ShareContactReadRepository } from '../repositories/readRepositories/shareContactReadRepository.js';
import type {
  AlbumMemberReadRepository,
  AlbumReadRepository,
  AuthorizationReadRepository,
  CommentReadRepository,
  GrantReadRepository,
  MediaItemReadRepository,
  PublicAccessReadRepository,
  PublicMediaItemReadRepository,
  ReactionReadRepository,
  SharedWithMeReadRepository,
  UserReadRepository,
} from '../repositories/readRepositories/types.js';
import type { SystemAlbumItemRepository } from '../repositories/systemRepositories/systemAlbumItemRepository.js';
import type { SystemAlbumRepository } from '../repositories/systemRepositories/systemAlbumRepository.js';
import type { SystemAsyncNotificationRepository } from '../repositories/systemRepositories/systemAsyncNotificationRepository.js';
import type { SystemAuthorizationRepository } from '../repositories/systemRepositories/systemAuthorizationRepository.js';
import type { SystemCommentRepository } from '../repositories/systemRepositories/systemCommentRepository.js';
import type { SystemEmailVerificationRepository } from '../repositories/systemRepositories/systemEmailVerificationRepository.js';
import type { SystemGrantRepository } from '../repositories/systemRepositories/systemGrantRepository.js';
import type { SystemInAppNotificationRepository } from '../repositories/systemRepositories/systemInAppNotificationRepository.js';
import type { SystemMediaItemRepository } from '../repositories/systemRepositories/systemMediaItemRepository.js';
import type { SystemUserRepository } from '../repositories/systemRepositories/systemUserRepository.js';
import type { CommentReadService } from '../services/readServices/comments/commentReadService.js';
import type { ValidateOperationService } from '../services/readServices/mediaGrantService.js';
import type { MediaItemOperationsService } from '../services/readServices/MediaItemOperationsService.js';
import type { PublicAccessReadService } from '../services/readServices/publicReadServices/publicAccessReadService.js';
import type { PublicAlbumReadService } from '../services/readServices/publicReadServices/publicAlbumReadService.js';
import type { PublicMediaItemReadService } from '../services/readServices/publicReadServices/publicMediaItemReadService.js';
import type { ReadReactionService } from '../services/readServices/readReactionService.js';
import type { EnrichMediaItems } from '../services/readServices/viewerReadServices/enrichMediaItems.js';
import type { ViewerAlbumReadService } from '../services/readServices/viewerReadServices/viewerAlbumReadService.js';
import type { viewerAuthorizationsReadService } from '../services/readServices/viewerReadServices/viewerAuthorizationsReadService.js';
import type { ViewerHasInAppNotificationService } from '../services/readServices/viewerReadServices/viewerHasInAppNotificationService.js';
import type { ViewerMediaItemReadService } from '../services/readServices/viewerReadServices/viewerMediaItemReadService.js';
import type { viewerReactionReadService } from '../services/readServices/viewerReadServices/viewerReactionReadService.js';
import type { ViewerSharedContactsReadService } from '../services/readServices/viewerReadServices/viewerSharedContactsReadService.js';
import type { ViewerSharedWithMeAlbumReadService } from '../services/readServices/viewerReadServices/viewerSharedWithMeAlbumReadService.js';
import type { AddAlbumItem } from '../services/writeServices/album/addAlbumItem.js';
import type { AddAlbumMembers } from '../services/writeServices/album/addAlbumMembers.js';
import type { AddMediaItemsToAlbum } from '../services/writeServices/album/addMediaItemsToAlbum.js';
import type { CreateAlbum } from '../services/writeServices/album/createAlbum.js';
import type { DeleteAlbum } from '../services/writeServices/album/deleteAlbum.js';
import type { DeleteAlbumItems } from '../services/writeServices/album/deleteAlbumItems.js';
import type { RemoveAlbumMembers } from '../services/writeServices/album/removeAlbumMembers.js';
import type { ReorderAlbumItems } from '../services/writeServices/album/reorderAlbumItems.js';
import type { RevokePublicLinkService } from '../services/writeServices/album/revokePublicLinkService.js';
import type { RevokeShareService } from '../services/writeServices/album/revokeShareService.js';
import type { SetCoverMedia } from '../services/writeServices/album/setCoverMedia.js';
import type { UnsetCoverMedia } from '../services/writeServices/album/unsetCoverMedia.js';
import type { UpdateAlbumMemberRoleService } from '../services/writeServices/album/updateAlbumMemberRoleService.js';
import type { DeleteShareContactService } from '../services/writeServices/authorization/deleteShareContactService.js';
import type { GrantUserAuthorization } from '../services/writeServices/authorization/grantAuthorizationForAlbum.js';
import type { AddComment } from '../services/writeServices/comments/addComment.js';
import type { DeleteComment } from '../services/writeServices/comments/deleteComment.js';
import type { EditComment } from '../services/writeServices/comments/editComment.js';
import type { MarkActivitySeen } from '../services/writeServices/markActivitySeen.js';
import type { CreateMediaUpload } from '../services/writeServices/mediaItem/createMediaItemUpload.js';
import type { DeleteMediaItem } from '../services/writeServices/mediaItem/deleteMediaItem.js';
import type { DeleteMediaItems } from '../services/writeServices/mediaItem/deleteMediaItems.js';
import type { FinalizeMediaItemUpload } from '../services/writeServices/mediaItem/finalizeMediaItemUpload.js';
import type { UpdateMediaItem } from '../services/writeServices/mediaItem/updateMediaItem.js';
import type { UpdateMediaItemTags } from '../services/writeServices/mediaItem/updateMediaItemTags.js';
import type { CreatePublicLinkForAlbum } from '../services/writeServices/publicLink/createPublicLinkForAlbum.js';
import type { CreatePublicLinkForMediaItems } from '../services/writeServices/publicLink/createPublicLinkForMediaItems.js';
import type { ToggleReaction } from '../services/writeServices/reactions/toggleReaction.js';
import type { ActivatePendingUserWriteService } from '../services/writeServices/user/activatePendingUserWriteService.js';
import type { CreateUserWriteService } from '../services/writeServices/user/createUserWriteService.js';

export interface IocGeneratedCradle {
  activatePendingUserWriteService: ActivatePendingUserWriteService;
  addAlbumItem: AddAlbumItem;
  addAlbumMembers: AddAlbumMembers;
  addComment: AddComment;
  addMediaItemsToAlbum: AddMediaItemsToAlbum;
  agnosticReadServices: {
    commentReadService: CommentReadService;
    publicAccessReadService: PublicAccessReadService;
  };
  albumItemReadRepository: AlbumItemReadRepository;
  albumMemberReadRepository: AlbumMemberReadRepository;
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  asyncWriter: AsyncWriter;
  authorizationReadRepository: AuthorizationReadRepository;
  authorizationReconciliation: DomainEventHandler;
  commentReadRepository: CommentReadRepository;
  commentReadService: CommentReadService;
  commentRepository: CommentRepository;
  createAlbum: CreateAlbum;
  createMediaItemUpload: CreateMediaUpload;
  createMediaUpload: CreateMediaUpload;
  createPublicLinkForAlbum: CreatePublicLinkForAlbum;
  createPublicLinkForMediaItems: CreatePublicLinkForMediaItems;
  createUserWriteService: CreateUserWriteService;
  deleteAlbum: DeleteAlbum;
  deleteAlbumItems: DeleteAlbumItems;
  deleteComment: DeleteComment;
  deleteMediaItem: DeleteMediaItem;
  deleteMediaItems: DeleteMediaItems;
  deleteShareContactService: DeleteShareContactService;
  domainEventHandlers: ReadonlyArray<
    DomainEventHandler<
      | 'albumSharedWithPublicLink'
      | 'albumSharedWithUser'
      | 'albumSharedWithPendingUser'
      | 'mediaItemAddedToAlbum'
      | 'mediaItemRemovedFromAlbum'
      | 'pendingUserActivated'
      | 'commentPosted'
      | 'reactionAdded'
    >
  >;
  editComment: EditComment;
  emailVerificationRepository: EmailVerificationRepository;
  enrichMediaItems: EnrichMediaItems;
  eventPublisher: EventPublisher;
  finalizeMediaItemUpload: FinalizeMediaItemUpload;
  grantReadRepository: GrantReadRepository;
  grantUserAuthorization: GrantUserAuthorization;
  inAppNotificationRepository: InAppNotificationRepository;
  inAppWriter: InAppWriter;
  markActivitySeen: MarkActivitySeen;
  mediaDeletionJobRepository: MediaDeletionJobRepository;
  mediaItemOperationsService: MediaItemOperationsService;
  mediaItemReadRepository: MediaItemReadRepository;
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaStorage: MediaStorage;
  notificationAddedToAlbumStrategy: NotificationStrategy;
  notificationAlbumSharedStrategy: NotificationStrategy;
  notificationCommentStrategy: NotificationStrategy;
  notificationDispatcher: DomainEventHandler;
  notificationGuestAlbumSharedStrategy: NotificationStrategy;
  notificationReactionStrategy: NotificationStrategy;
  notificationRepository: NotificationRepository;
  notificationStrategies: ReadonlyArray<
    NotificationStrategy<
      | 'albumSharedWithPublicLink'
      | 'albumSharedWithUser'
      | 'albumSharedWithPendingUser'
      | 'mediaItemAddedToAlbum'
      | 'mediaItemRemovedFromAlbum'
      | 'pendingUserActivated'
      | 'commentPosted'
      | 'reactionAdded'
    >
  >;
  notificationWriters: {
    asyncWriter: AsyncWriter;
    inAppWriter: InAppWriter;
  };
  publicAccessReadRepository: PublicAccessReadRepository;
  publicAccessReadService: PublicAccessReadService;
  publicAlbumReadService: PublicAlbumReadService;
  publicMediaItemReadRepository: PublicMediaItemReadRepository;
  publicMediaItemReadService: PublicMediaItemReadService;
  publicReadServices: {
    publicAlbumReadService: PublicAlbumReadService;
    publicMediaItemReadService: PublicMediaItemReadService;
  };
  reactionReadRepository: ReactionReadRepository;
  readReactionService: ReadReactionService;
  readServices: {
    viewerAlbumReadService: ViewerAlbumReadService;
    viewerAuthorizationsReadService: viewerAuthorizationsReadService;
    viewerHasInAppNotificationService: ViewerHasInAppNotificationService;
    viewerMediaItemReadService: ViewerMediaItemReadService;
    viewerReactionReadService: viewerReactionReadService;
    viewerSharedContactsReadService: ViewerSharedContactsReadService;
    viewerSharedWithMeAlbumReadService: ViewerSharedWithMeAlbumReadService;
  };
  removeAlbumMembers: RemoveAlbumMembers;
  reorderAlbumItems: ReorderAlbumItems;
  resolveAuthorizations: ResolveAuthorizations;
  revokePublicLinkService: RevokePublicLinkService;
  revokeShareService: RevokeShareService;
  setCoverMedia: SetCoverMedia;
  shareContactReadRepository: ShareContactReadRepository;
  shareContactRepository: ShareContactRepository;
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  systemAlbumItemRepository: SystemAlbumItemRepository;
  systemAlbumRepository: SystemAlbumRepository;
  systemAsyncNotificationRepository: SystemAsyncNotificationRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  systemCommentRepository: SystemCommentRepository;
  systemEmailVerificationRepository: SystemEmailVerificationRepository;
  systemGrantRepository: SystemGrantRepository;
  systemInAppNotificationRepository: SystemInAppNotificationRepository;
  systemMediaItemRepository: SystemMediaItemRepository;
  systemUserRepository: SystemUserRepository;
  toggleReaction: ToggleReaction;
  unitOfWork: UnitOfWork;
  unsetCoverMedia: UnsetCoverMedia;
  updateAlbumMemberRoleService: UpdateAlbumMemberRoleService;
  updateMediaItem: UpdateMediaItem;
  updateMediaItemTags: UpdateMediaItemTags;
  userReadRepository: UserReadRepository;
  userRepository: UserRepository;
  validateOperationService: ValidateOperationService;
  viewerAlbumReadService: ViewerAlbumReadService;
  viewerAuthorizationsReadService: viewerAuthorizationsReadService;
  viewerHasInAppNotificationService: ViewerHasInAppNotificationService;
  viewerMediaItemReadService: ViewerMediaItemReadService;
  viewerReactionReadService: viewerReactionReadService;
  viewerSharedContactsReadService: ViewerSharedContactsReadService;
  viewerSharedWithMeAlbumReadService: ViewerSharedWithMeAlbumReadService;
  writeServices: {
    activatePendingUserWriteService: ActivatePendingUserWriteService;
    addAlbumItem: AddAlbumItem;
    addAlbumMembers: AddAlbumMembers;
    addComment: AddComment;
    addMediaItemsToAlbum: AddMediaItemsToAlbum;
    createAlbum: CreateAlbum;
    createMediaUpload: CreateMediaUpload;
    createPublicLinkForAlbum: CreatePublicLinkForAlbum;
    createPublicLinkForMediaItems: CreatePublicLinkForMediaItems;
    createUserWriteService: CreateUserWriteService;
    deleteAlbum: DeleteAlbum;
    deleteAlbumItems: DeleteAlbumItems;
    deleteComment: DeleteComment;
    deleteMediaItem: DeleteMediaItem;
    deleteMediaItems: DeleteMediaItems;
    deleteShareContactService: DeleteShareContactService;
    editComment: EditComment;
    finalizeMediaItemUpload: FinalizeMediaItemUpload;
    grantUserAuthorization: GrantUserAuthorization;
    markActivitySeen: MarkActivitySeen;
    removeAlbumMembers: RemoveAlbumMembers;
    reorderAlbumItems: ReorderAlbumItems;
    revokePublicLinkService: RevokePublicLinkService;
    revokeShareService: RevokeShareService;
    setCoverMedia: SetCoverMedia;
    toggleReaction: ToggleReaction;
    unsetCoverMedia: UnsetCoverMedia;
    updateAlbumMemberRoleService: UpdateAlbumMemberRoleService;
    updateMediaItem: UpdateMediaItem;
    updateMediaItemTags: UpdateMediaItemTags;
  };
}

export type AgnosticReadServices = {
  commentReadService: CommentReadService;
  publicAccessReadService: PublicAccessReadService;
};

export type DomainEventHandlers = ReadonlyArray<
  DomainEventHandler<
    | 'albumSharedWithPublicLink'
    | 'albumSharedWithUser'
    | 'albumSharedWithPendingUser'
    | 'mediaItemAddedToAlbum'
    | 'mediaItemRemovedFromAlbum'
    | 'pendingUserActivated'
    | 'commentPosted'
    | 'reactionAdded'
  >
>;

export type NotificationStrategies = ReadonlyArray<
  NotificationStrategy<
    | 'albumSharedWithPublicLink'
    | 'albumSharedWithUser'
    | 'albumSharedWithPendingUser'
    | 'mediaItemAddedToAlbum'
    | 'mediaItemRemovedFromAlbum'
    | 'pendingUserActivated'
    | 'commentPosted'
    | 'reactionAdded'
  >
>;

export type NotificationWriters = {
  asyncWriter: AsyncWriter;
  inAppWriter: InAppWriter;
};

export type PublicReadServices = {
  publicAlbumReadService: PublicAlbumReadService;
  publicMediaItemReadService: PublicMediaItemReadService;
};

export type ReadServices = {
  viewerAlbumReadService: ViewerAlbumReadService;
  viewerAuthorizationsReadService: viewerAuthorizationsReadService;
  viewerHasInAppNotificationService: ViewerHasInAppNotificationService;
  viewerMediaItemReadService: ViewerMediaItemReadService;
  viewerReactionReadService: viewerReactionReadService;
  viewerSharedContactsReadService: ViewerSharedContactsReadService;
  viewerSharedWithMeAlbumReadService: ViewerSharedWithMeAlbumReadService;
};

export type WriteServices = {
  activatePendingUserWriteService: ActivatePendingUserWriteService;
  addAlbumItem: AddAlbumItem;
  addAlbumMembers: AddAlbumMembers;
  addComment: AddComment;
  addMediaItemsToAlbum: AddMediaItemsToAlbum;
  createAlbum: CreateAlbum;
  createMediaUpload: CreateMediaUpload;
  createPublicLinkForAlbum: CreatePublicLinkForAlbum;
  createPublicLinkForMediaItems: CreatePublicLinkForMediaItems;
  createUserWriteService: CreateUserWriteService;
  deleteAlbum: DeleteAlbum;
  deleteAlbumItems: DeleteAlbumItems;
  deleteComment: DeleteComment;
  deleteMediaItem: DeleteMediaItem;
  deleteMediaItems: DeleteMediaItems;
  deleteShareContactService: DeleteShareContactService;
  editComment: EditComment;
  finalizeMediaItemUpload: FinalizeMediaItemUpload;
  grantUserAuthorization: GrantUserAuthorization;
  markActivitySeen: MarkActivitySeen;
  removeAlbumMembers: RemoveAlbumMembers;
  reorderAlbumItems: ReorderAlbumItems;
  revokePublicLinkService: RevokePublicLinkService;
  revokeShareService: RevokeShareService;
  setCoverMedia: SetCoverMedia;
  toggleReaction: ToggleReaction;
  unsetCoverMedia: UnsetCoverMedia;
  updateAlbumMemberRoleService: UpdateAlbumMemberRoleService;
  updateMediaItem: UpdateMediaItem;
  updateMediaItemTags: UpdateMediaItemTags;
};

export interface IocExternals {
  config: MediaStorageConfig;
  database: Knex<any, any[]>;
  logger: Logger;
  rateLimiter: RateLimiter;
}

/**
 * Values supplied at runtime by registering onto a request child scope
 * (e.g. `scope.register({ key: asValue(...) })`) — not built by any factory.
 *
 * Register the relevant key(s) onto the child scope before resolving services that
 * depend on them. Resolving a dependent service without the value throws at runtime
 * (`IocResolutionError`), never returns a placeholder.
 *
 * Not every key is needed on every scope — register only those the current request
 * path actually resolves (e.g. an authed path vs. a public path).
 */
export interface IocScopeProvided {
  publicLinkId: string;
  uow: UnitOfWork;
  viewerId: string;
}
