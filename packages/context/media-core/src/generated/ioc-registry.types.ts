/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { Logger } from '@packages/infrastructure';
import type { Knex } from 'knex';
import type { MediaStorage } from '../application/media/MediaStorage.js';
import type { MediaStorageConfig } from '../application/media/s3MediaStorage.js';
import type {
  RunInTransaction,
  WithTransaction,
} from '../infrastructure/repositories/runInTransaction.js';
import type { AlbumRepository } from '../repositories/domainRepositories/albumRepository.js';
import type { CommentRepository } from '../repositories/domainRepositories/commentRepository.js';
import type { GrantRepository } from '../repositories/domainRepositories/grantRepository.js';
import type { MediaItemRepository } from '../repositories/domainRepositories/mediaItemRepository.js';
import type { NotificationRepository } from '../repositories/domainRepositories/notificationRepository.js';
import type { UserRepository } from '../repositories/domainRepositories/userRepository.js';
import type { GrantSync } from '../repositories/grantSync.js';
import type { MediaProcessingJobRepository } from '../repositories/MediaProcessingJob/MediaProcessingJobRepository.js';
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
  ShareContactRepository,
  SharedWithMeReadRepository,
  UserReadRepository,
} from '../repositories/readRepositories/types.js';
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
import type { ViewerMediaItemReadService } from '../services/readServices/viewerReadServices/viewerMediaItemReadService.js';
import type { viewerReactionReadService } from '../services/readServices/viewerReadServices/viewerReactionReadService.js';
import type { ViewerSharedContactsReadService } from '../services/readServices/viewerReadServices/viewerSharedContactsReadService.js';
import type { ViewerSharedWithMeAlbumReadService } from '../services/readServices/viewerReadServices/viewerSharedWithMeAlbumReadService.js';
import type { ViewerSharedWithMeMediaItemReadService } from '../services/readServices/viewerReadServices/viewerSharedWithMeMediaItemReadService.js';
import type { AddAlbumItem } from '../services/writeServices/album/addAlbumItem.js';
import type { AddMediaItemsToAlbum } from '../services/writeServices/album/addMediaItemsToAlbum.js';
import type { CreateAlbum } from '../services/writeServices/album/createAlbum.js';
import type { DeleteAlbum } from '../services/writeServices/album/deleteAlbum.js';
import type { DeleteAlbumItems } from '../services/writeServices/album/deleteAlbumItems.js';
import type { ReorderAlbumItems } from '../services/writeServices/album/reorderAlbumItems.js';
import type { SetCoverMedia } from '../services/writeServices/album/setCoverMedia.js';
import type { UnsetCoverMedia } from '../services/writeServices/album/unsetCoverMedia.js';
import type { GrantUserAuthorizationForAlbum } from '../services/writeServices/authorization/grantAuthorizationForAlbum.js';
import type { GrantAuthorizationForMediaItems } from '../services/writeServices/authorization/grantAuthorizationForMediaItems.js';
import type { AddComment } from '../services/writeServices/comments/addComment.js';
import type { DeleteComment } from '../services/writeServices/comments/deleteComment.js';
import type { EditComment } from '../services/writeServices/comments/editComment.js';
import type { CreateMediaUpload } from '../services/writeServices/mediaItem/createMediaItemUpload.js';
import type { DeleteMediaItem } from '../services/writeServices/mediaItem/deleteMediaItem.js';
import type { DeleteMediaItems } from '../services/writeServices/mediaItem/deleteMediaItems.js';
import type { FinalizeMediaItemUpload } from '../services/writeServices/mediaItem/finalizeMediaItemUpload.js';
import type { UpdateMediaItem } from '../services/writeServices/mediaItem/updateMediaItem.js';
import type { UpdateMediaItemTags } from '../services/writeServices/mediaItem/updateMediaItemTags.js';
import type { CreatePublicLinkForAlbum } from '../services/writeServices/publicLink/createPublicLinkForAlbum.js';
import type { CreatePublicLinkForMediaItems } from '../services/writeServices/publicLink/createPublicLinkForMediaItems.js';
import type { ToggleReaction } from '../services/writeServices/reactions/toggleReaction.js';

export interface IocGeneratedCradle {
  addAlbumItem: AddAlbumItem;
  addComment: AddComment;
  addMediaItemsToAlbum: AddMediaItemsToAlbum;
  agnosticReadServices: {
    commentReadService: CommentReadService;
    publicAccessReadService: PublicAccessReadService;
  };
  albumMemberReadRepository: AlbumMemberReadRepository;
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  authorizationReadRepository: AuthorizationReadRepository;
  commentReadRepository: CommentReadRepository;
  commentReadService: CommentReadService;
  commentRepository: CommentRepository;
  createAlbum: CreateAlbum;
  createMediaItemUpload: CreateMediaUpload;
  createMediaUpload: CreateMediaUpload;
  createPublicLinkForAlbum: CreatePublicLinkForAlbum;
  createPublicLinkForMediaItems: CreatePublicLinkForMediaItems;
  deleteAlbum: DeleteAlbum;
  deleteAlbumItems: DeleteAlbumItems;
  deleteComment: DeleteComment;
  deleteMediaItem: DeleteMediaItem;
  deleteMediaItems: DeleteMediaItems;
  editComment: EditComment;
  enrichMediaItems: EnrichMediaItems;
  finalizeMediaItemUpload: FinalizeMediaItemUpload;
  grantAuthorizationForMediaItems: GrantAuthorizationForMediaItems;
  grantReadRepository: GrantReadRepository;
  grantRepository: GrantRepository;
  grantSync: GrantSync;
  grantUserAuthorizationForAlbum: GrantUserAuthorizationForAlbum;
  mediaItemOperationsService: MediaItemOperationsService;
  mediaItemReadRepository: MediaItemReadRepository;
  mediaItemRepository: MediaItemRepository;
  mediaStorage: MediaStorage;
  notificationRepository: NotificationRepository;
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
    viewerMediaItemReadService: ViewerMediaItemReadService;
    viewerReactionReadService: viewerReactionReadService;
    viewerSharedContactsReadService: ViewerSharedContactsReadService;
    viewerSharedWithMeAlbumReadService: ViewerSharedWithMeAlbumReadService;
    viewerSharedWithMeMediaItemReadService: ViewerSharedWithMeMediaItemReadService;
  };
  reorderAlbumItems: ReorderAlbumItems;
  runInTransaction: RunInTransaction;
  setCoverMedia: SetCoverMedia;
  shareContactRepository: ShareContactRepository;
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  toggleReaction: ToggleReaction;
  unsetCoverMedia: UnsetCoverMedia;
  updateMediaItem: UpdateMediaItem;
  updateMediaItemTags: UpdateMediaItemTags;
  userReadRepository: UserReadRepository;
  userRepository: UserRepository;
  validateOperationService: ValidateOperationService;
  viewerAlbumReadService: ViewerAlbumReadService;
  viewerAuthorizationsReadService: viewerAuthorizationsReadService;
  viewerMediaItemReadService: ViewerMediaItemReadService;
  viewerReactionReadService: viewerReactionReadService;
  viewerSharedContactsReadService: ViewerSharedContactsReadService;
  viewerSharedWithMeAlbumReadService: ViewerSharedWithMeAlbumReadService;
  viewerSharedWithMeMediaItemReadService: ViewerSharedWithMeMediaItemReadService;
  withTransaction: WithTransaction;
  writeServices: {
    addAlbumItem: AddAlbumItem;
    addComment: AddComment;
    addMediaItemsToAlbum: AddMediaItemsToAlbum;
    createAlbum: CreateAlbum;
    createMediaUpload: CreateMediaUpload;
    createPublicLinkForAlbum: CreatePublicLinkForAlbum;
    createPublicLinkForMediaItems: CreatePublicLinkForMediaItems;
    deleteAlbum: DeleteAlbum;
    deleteAlbumItems: DeleteAlbumItems;
    deleteComment: DeleteComment;
    deleteMediaItem: DeleteMediaItem;
    deleteMediaItems: DeleteMediaItems;
    editComment: EditComment;
    finalizeMediaItemUpload: FinalizeMediaItemUpload;
    grantAuthorizationForMediaItems: GrantAuthorizationForMediaItems;
    grantUserAuthorizationForAlbum: GrantUserAuthorizationForAlbum;
    reorderAlbumItems: ReorderAlbumItems;
    setCoverMedia: SetCoverMedia;
    toggleReaction: ToggleReaction;
    unsetCoverMedia: UnsetCoverMedia;
    updateMediaItem: UpdateMediaItem;
    updateMediaItemTags: UpdateMediaItemTags;
  };
}

export interface IocExternals {
  config: MediaStorageConfig;
  database: Knex;
  logger: Logger;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
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
  viewerId: string;
}
