/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type Router from '@koa/router';
import type { Logger, RateLimiter } from '@packages/infrastructure';
import type {
  ActivatePendingUserWriteService,
  EmailVerificationRepository,
  GrantReadRepository,
  MediaItemReadRepository,
  MediaStorage,
  PublicAccessReadService,
  SystemEmailVerificationRepository,
  UnitOfWork,
  UserRepository,
} from '@packages/media-core';
import type { NotificationService } from '@packages/notifications';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';
import type { Config } from '../../config.js';
import type { AuthController } from '../../controllers/authController.js';
import type { MediaServeController } from '../../controllers/mediaServeController.js';
import type { GraphQLContextFactory, RequestScope } from '../../graphql/context/types.js';
import type { GraphQLServer, YogaApp } from '../../graphql/server/createGraphQLServer.js';
import type { KnexConfig } from '../../knexfile.js';
import type { KoaServer } from '../../koaServer.js';
import type { AuthMiddleware } from '../../middleware/authMiddleware.js';
import type { ErrorHandler } from '../../middleware/errorHandler.js';
import type { MediaAuthMiddleware } from '../../middleware/mediaAuthMiddleware.js';
import type { RequestLogger } from '../../middleware/requestLogger.js';
import type { TokenHandshakeMiddleware } from '../../middleware/tokenHandshakeMiddleware.js';
import type { RootRouter } from '../../routes/apiRouter.js';
import type { MediaPublicRouter } from '../../routes/mediaPublicRouter.js';
import type { Server } from '../../server.js';
import type { AuthQueryService } from '../../services/authQueryService.js';
import type { AuthService } from '../../services/authService.js';
import type { MediaGrantService } from '../../services/mediaGrantService.js';
import type { TokenVerifier } from '../../services/tokenVerifier.js';

export interface IocGeneratedCradle {
  apiRoutes: RootRouter;
  authController: AuthController;
  authQueryService: AuthQueryService;
  authService: AuthService;
  config: Config;
  createGraphQlContext: GraphQLContextFactory;
  database: Knex<any, any[]>;
  errorHandler: ErrorHandler;
  graphQlServer: GraphQLServer;
  knexConfig: KnexConfig;
  koaServer: KoaServer;
  mediaAuthMiddleware: MediaAuthMiddleware;
  mediaGrantService: MediaGrantService;
  mediaPublicRouter: MediaPublicRouter;
  mediaServeController: MediaServeController;
  optionalAuthMiddleware: AuthMiddleware;
  requestLogger: RequestLogger;
  router: Router;
  server: Server;
  strictAuthMiddleware: AuthMiddleware;
  tokenHandshakeMiddleware: TokenHandshakeMiddleware;
  tokenVerifier: TokenVerifier;
  yogaApp: YogaApp;
}

export interface IocExternals {
  activatePendingUserWriteService: ActivatePendingUserWriteService;
  authMiddleware: AuthMiddleware;
  container: AwilixContainer<RequestScope>;
  emailVerificationRepository: EmailVerificationRepository;
  grantReadRepository: GrantReadRepository;
  graphQlContextFactory: GraphQLContextFactory;
  logger: Logger;
  mediaItemReadRepository: MediaItemReadRepository;
  mediaStorage: MediaStorage;
  notificationService: NotificationService;
  publicAccessReadService: PublicAccessReadService;
  rateLimiter: RateLimiter;
  rootRouter: RootRouter;
  systemEmailVerificationRepository: SystemEmailVerificationRepository;
  uow: UnitOfWork;
  userRepository: UserRepository;
}

export interface IocScopeProvided {}
