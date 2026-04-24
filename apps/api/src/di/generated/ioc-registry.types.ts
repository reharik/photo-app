/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type Router from '@koa/router';
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
import type { Config } from '../../config.js';
import type { AuthController } from '../../controllers/authController.js';
import type { MediaServeController } from '../../controllers/mediaServeController.js';
import type { GraphQLContextFactory } from '../../graphql/context/types.js';
import type { GraphQLServer, YogaApp } from '../../graphql/server/createGraphQLServer.js';
import type { KnexConfig } from '../../knexfile.js';
import type { KoaServer } from '../../koaServer.js';
import type { AuthMiddleware } from '../../middleware/authMiddleware.js';
import type { ErrorHandler } from '../../middleware/errorHandler.js';
import type { MediaAuthMiddleware } from '../../middleware/mediaAuthMiddleware.js';
import type { RequestLogger } from '../../middleware/requestLogger.js';
import type { MediaProcessingJobRepository } from '../../repositories/domainRepositories/mediaProcessingJobRepository.js';
import type { RootRouter } from '../../routes/apiRouter.js';
import type { MediaPublicRouter } from '../../routes/mediaPublicRouter.js';
import type { Server } from '../../server.js';
import type { AuthService } from '../../services/authService.js';
import type { MediaGrantService } from '../../services/mediaGrantService.js';

export interface IocGeneratedTypes {
  addAlbumItem: AddAlbumItem;
  addMediaItemsToAlbum: AddMediaItemsToAlbum;
  albumReadRepository: AlbumReadRepository;
  albumRepository: AlbumRepository;
  authController: AuthController;
  authMiddleware: AuthMiddleware;
  authMiddlewares: ReadonlyArray<AuthMiddleware>;
  authService: AuthService;
  commentRepository: CommentRepository;
  config: Config;
  createAlbum: CreateAlbum;
  createMediaUpload: CreateMediaUpload;
  deleteAlbum: DeleteAlbum;
  deleteAlbumItems: DeleteAlbumItems;
  deleteMediaItem: DeleteMediaItem;
  deleteMediaItems: DeleteMediaItems;
  errorHandler: ErrorHandler;
  finalizeMediaItemUpload: FinalizeMediaItemUpload;
  grantReadRepository: GrantReadRepository;
  graphQLContextFactory: GraphQLContextFactory;
  graphQLServer: GraphQLServer;
  database: Knex;
  knexConfig: KnexConfig;
  koaServer: KoaServer;
  logger: Logger;
  mediaAssetReadRepository: MediaAssetReadRepository;
  mediaAuthMiddleware: MediaAuthMiddleware;
  mediaGrantService: MediaGrantService;
  mediaItemReadRepository: MediaItemReadRepository;
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  mediaPublicRouter: MediaPublicRouter;
  mediaServeController: MediaServeController;
  mediaStorage: MediaStorage;
  notificationRepository: NotificationRepository;
  reorderAlbumItems: ReorderAlbumItems;
  requestLogger: RequestLogger;
  rootRouter: RootRouter;
  router: Router;
  server: Server;
  setCoverMedia: SetCoverMedia;
  shareLinkRepository: ShareLinkRepository;
  unsetCoverMedia: UnsetCoverMedia;
  updateMediaItem: UpdateMediaItem;
  updateMediaItemTags: UpdateMediaItemTags;
  userRepository: UserRepository;
  viewerAlbumReadServiceFactory: ViewerAlbumReadServiceFactory;
  viewerMediaItemReadServiceFactory: ViewerMediaItemReadServiceFactory;
  yogaApp: YogaApp;
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
