/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { Knex } from 'knex';
import type { MediaStorage } from '../application/media/MediaStorage.js';
import type { MediaStorageConfig } from '../application/media/s3MediaStorage.js';
import type { MediaProcessingJobRepository } from '../domain/MediaProcessingJob/MediaProcessingJobRepository.js';
import type { AlbumRepository } from '../repositories/domainRepositories/albumRepository.js';
import type { CommentRepository } from '../repositories/domainRepositories/commentRepository.js';
import type { GrantRepository } from '../repositories/domainRepositories/grantRepository.js';
import type { MediaItemRepository } from '../repositories/domainRepositories/mediaItemRepository.js';
import type { NotificationRepository } from '../repositories/domainRepositories/notificationRepository.js';
import type { ReactionRepository } from '../repositories/domainRepositories/reactionRepository.js';
import type { UserRepository } from '../repositories/domainRepositories/userRepository.js';
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
import type { PublicAlbumReadServiceFactory } from '../services/readServices/publicReadServices/publicAlbumReadService.js';
import type { PublicMediaItemReadServiceFactory } from '../services/readServices/publicReadServices/publicMediaItemReadService.js';
import type { ReadReactionService } from '../services/readServices/readReactionService.js';
import type { EnrichMediaItems } from '../services/readServices/viewerReadServices/enrichMediaItems.js';
import type { ViewerAlbumReadServiceFactory } from '../services/readServices/viewerReadServices/viewerAlbumReadService.js';
import type { viewerAuthorizationsReadServiceFactory } from '../services/readServices/viewerReadServices/viewerAuthorizationsReadService.js';
import type { ViewerMediaItemReadServiceFactory } from '../services/readServices/viewerReadServices/viewerMediaItemReadService.js';
import type { ViewerReactionReadServiceFactory } from '../services/readServices/viewerReadServices/viewerReactionReadService.js';
import type { ViewerSharedContactsReadServiceFactory } from '../services/readServices/viewerReadServices/viewerSharedContactsReadService.js';
import type { ViewerSharedWithMeMediaItemReadServiceFactory } from '../services/readServices/viewerReadServices/viewerSharedWithMeMediaItemReadService.js';
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
import type { AddReaction } from '../services/writeServices/reactions/addReaction.js';
import type { RemoveReaction } from '../services/writeServices/reactions/removeReaction.js';

export interface IocGeneratedCradle {
  addAlbumItem: AddAlbumItem;
  addComment: AddComment;
  addMediaItemsToAlbum: AddMediaItemsToAlbum;
  addReaction: AddReaction;
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
  grantUserAuthorizationForAlbum: GrantUserAuthorizationForAlbum;
  mediaItemOperationsService: MediaItemOperationsService;
  mediaItemReadRepository: MediaItemReadRepository;
  mediaItemRepository: MediaItemRepository;
  mediaStorage: MediaStorage;
  notificationRepository: NotificationRepository;
  publicAccessReadRepository: PublicAccessReadRepository;
  publicAccessReadService: PublicAccessReadService;
  publicAlbumReadServiceFactory: PublicAlbumReadServiceFactory;
  publicMediaItemReadRepository: PublicMediaItemReadRepository;
  publicMediaItemReadServiceFactory: PublicMediaItemReadServiceFactory;
  publicReadServiceFactories: {
    publicAlbumReadServiceFactory: PublicAlbumReadServiceFactory;
    publicMediaItemReadServiceFactory: PublicMediaItemReadServiceFactory;
  };
  reactionReadRepository: ReactionReadRepository;
  reactionRepository: ReactionRepository;
  readReactionService: ReadReactionService;
  readServiceFactories: {
    viewerAlbumReadServiceFactory: ViewerAlbumReadServiceFactory;
    viewerAuthorizationsReadServiceFactory: viewerAuthorizationsReadServiceFactory;
    viewerMediaItemReadServiceFactory: ViewerMediaItemReadServiceFactory;
    viewerReactionReadServiceFactory: ViewerReactionReadServiceFactory;
    viewerSharedContactsReadServiceFactory: ViewerSharedContactsReadServiceFactory;
    viewerSharedWithMeMediaItemReadServiceFactory: ViewerSharedWithMeMediaItemReadServiceFactory;
  };
  removeReaction: RemoveReaction;
  reorderAlbumItems: ReorderAlbumItems;
  setCoverMedia: SetCoverMedia;
  shareContactRepository: ShareContactRepository;
  sharedWithMeReadRepository: SharedWithMeReadRepository;
  unsetCoverMedia: UnsetCoverMedia;
  updateMediaItem: UpdateMediaItem;
  updateMediaItemTags: UpdateMediaItemTags;
  userReadRepository: UserReadRepository;
  userRepository: UserRepository;
  validateOperationService: ValidateOperationService;
  viewerAlbumReadServiceFactory: ViewerAlbumReadServiceFactory;
  viewerAuthorizationsReadServiceFactory: viewerAuthorizationsReadServiceFactory;
  viewerMediaItemReadServiceFactory: ViewerMediaItemReadServiceFactory;
  viewerReactionReadServiceFactory: ViewerReactionReadServiceFactory;
  viewerSharedContactsReadServiceFactory: ViewerSharedContactsReadServiceFactory;
  viewerSharedWithMeMediaItemReadServiceFactory: ViewerSharedWithMeMediaItemReadServiceFactory;
  writeServices: {
    addAlbumItem: AddAlbumItem;
    addComment: AddComment;
    addMediaItemsToAlbum: AddMediaItemsToAlbum;
    addReaction: AddReaction;
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
    removeReaction: RemoveReaction;
    reorderAlbumItems: ReorderAlbumItems;
    setCoverMedia: SetCoverMedia;
    unsetCoverMedia: UnsetCoverMedia;
    updateMediaItem: UpdateMediaItem;
    updateMediaItemTags: UpdateMediaItemTags;
  };
}

export interface IocExternals {
  config: MediaStorageConfig;
  database: Knex;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
}
