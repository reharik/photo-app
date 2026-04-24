/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { Logger } from '@packages/infrastructure';
import type {
  AddAlbumItem,
  AddMediaItemsToAlbum,
  AlbumReadRepository,
  AlbumRepository,
  CommentRepository,
  CreateAlbum,
  CreateMediaUpload,
  DeleteAlbum,
  DeleteAlbumItems,
  DeleteMediaItem,
  DeleteMediaItems,
  FinalizeMediaItemUpload,
  GrantReadRepository,
  MediaAssetReadRepository,
  MediaItemReadRepository,
  MediaItemRepository,
  MediaStorage,
  NotificationRepository,
  ReorderAlbumItems,
  SetCoverMedia,
  ShareLinkRepository,
  UnsetCoverMedia,
  UpdateMediaItem,
  UpdateMediaItemTags,
  UserRepository,
  ViewerAlbumReadServiceFactory,
  ViewerMediaItemReadServiceFactory,
} from '@packages/media-core';
import type { Knex } from 'knex';
import type { ProcessNextMediaDeletionJob } from '../../application/processNextMediaDeletionJob.js';
import type { ProcessNextMediaImageJob } from '../../application/processNextMediaImageJob.js';
import type { Config } from '../../config.js';
import type { KnexConfig } from '../../knexfile.js';
import type { MediaDeletionJobRepository } from '../../repositories/domainRepositories/mediaDeletionJobRepository.js';
import type { MediaProcessingJobRepository } from '../../repositories/domainRepositories/mediaProcessingJobRepository.js';
import type { RunMediaWorkerLoop } from '../../runMediaWorkerLoop.js';

export interface IocGeneratedTypes {
  addAlbumItem: AddAlbumItem;
  addMediaItemsToAlbum: AddMediaItemsToAlbum;
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  commentRepository: CommentRepository;
  config: Config;
  createAlbum: CreateAlbum;
  createMediaUpload: CreateMediaUpload;
  deleteAlbum: DeleteAlbum;
  deleteAlbumItems: DeleteAlbumItems;
  deleteMediaItem: DeleteMediaItem;
  deleteMediaItems: DeleteMediaItems;
  finalizeMediaItemUpload: FinalizeMediaItemUpload;
  grantReadRepository: GrantReadRepository;
  database: Knex;
  knexConfig: KnexConfig;
  logger: Logger;
  mediaAssetReadRepository: MediaAssetReadRepository;
  mediaDeletionJobRepository: MediaDeletionJobRepository;
  mediaItemReadRepository: MediaItemReadRepository;
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaStorage: MediaStorage;
  notificationRepository: NotificationRepository;
  processNextMediaDeletionJob: ProcessNextMediaDeletionJob;
  processNextMediaImageJob: ProcessNextMediaImageJob;
  reorderAlbumItems: ReorderAlbumItems;
  runMediaWorkerLoop: RunMediaWorkerLoop;
  setCoverMedia: SetCoverMedia;
  shareLinkRepository: ShareLinkRepository;
  unsetCoverMedia: UnsetCoverMedia;
  updateMediaItem: UpdateMediaItem;
  updateMediaItemTags: UpdateMediaItemTags;
  userRepository: UserRepository;
  viewerAlbumReadServiceFactory: ViewerAlbumReadServiceFactory;
  viewerMediaItemReadServiceFactory: ViewerMediaItemReadServiceFactory;
  readServiceFactories: {
    viewerAlbumReadServiceFactory: ViewerAlbumReadServiceFactory;
    viewerMediaItemReadServiceFactory: ViewerMediaItemReadServiceFactory;
  };
  writeServices: {
    addAlbumItem: AddAlbumItem;
    addMediaItemsToAlbum: AddMediaItemsToAlbum;
    createAlbum: CreateAlbum;
    createMediaUpload: CreateMediaUpload;
    deleteAlbum: DeleteAlbum;
    deleteAlbumItems: DeleteAlbumItems;
    deleteMediaItem: DeleteMediaItem;
    deleteMediaItems: DeleteMediaItems;
    finalizeMediaItemUpload: FinalizeMediaItemUpload;
    reorderAlbumItems: ReorderAlbumItems;
    setCoverMedia: SetCoverMedia;
    unsetCoverMedia: UnsetCoverMedia;
    updateMediaItem: UpdateMediaItem;
    updateMediaItemTags: UpdateMediaItemTags;
  };
}

export type IocGeneratedCradle = IocGeneratedTypes;
