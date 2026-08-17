/* AUTO-GENERATED. DO NOT EDIT.
Primary container manifest.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { IocGeneratedContainerManifest, IocModuleNamespace } from 'ioc-manifest';

import * as ioc_config from '../../config.js';
import * as ioc_controllers_authController from '../../controllers/authController.js';
import * as ioc_controllers_mediaServeController from '../../controllers/mediaServeController.js';
import * as ioc_graphql_context_createGraphQLContext from '../../graphql/context/createGraphQLContext.js';
import * as ioc_graphql_server_createGraphQLServer from '../../graphql/server/createGraphQLServer.js';
import * as ioc_knex from '../../knex.js';
import * as ioc_knexfile from '../../knexfile.js';
import * as ioc_koaServer from '../../koaServer.js';
import * as ioc_middleware_authMiddleware from '../../middleware/authMiddleware.js';
import * as ioc_middleware_errorHandler from '../../middleware/errorHandler.js';
import * as ioc_middleware_mediaAuthMiddleware from '../../middleware/mediaAuthMiddleware.js';
import * as ioc_middleware_requestLogger from '../../middleware/requestLogger.js';
import * as ioc_middleware_tokenHandshakeMiddleware from '../../middleware/tokenHandshakeMiddleware.js';
import * as ioc_routes_apiRouter from '../../routes/apiRouter.js';
import * as ioc_routes_authRouter from '../../routes/authRouter.js';
import * as ioc_routes_mediaPublicRouter from '../../routes/mediaPublicRouter.js';
import * as ioc_server from '../../server.js';
import * as ioc_services_authQueryService from '../../services/authQueryService.js';
import * as ioc_services_authService from '../../services/authService.js';
import * as ioc_services_mediaGrantService from '../../services/mediaGrantService.js';
import * as ioc_services_tokenVerifier from '../../services/tokenVerifier.js';

export const iocManifest = {
  manifestSchemaVersion: 2,

  moduleImports: [
    ioc_config,
    ioc_controllers_authController,
    ioc_controllers_mediaServeController,
    ioc_graphql_context_createGraphQLContext,
    ioc_graphql_server_createGraphQLServer,
    ioc_knex,
    ioc_knexfile,
    ioc_koaServer,
    ioc_middleware_authMiddleware,
    ioc_middleware_errorHandler,
    ioc_middleware_mediaAuthMiddleware,
    ioc_middleware_requestLogger,
    ioc_middleware_tokenHandshakeMiddleware,
    ioc_routes_apiRouter,
    ioc_routes_authRouter,
    ioc_routes_mediaPublicRouter,
    ioc_server,
    ioc_services_authQueryService,
    ioc_services_authService,
    ioc_services_mediaGrantService,
    ioc_services_tokenVerifier,
  ] as const satisfies readonly IocModuleNamespace[],

  contracts: {
    AuthController: {
      authController: {
        exportName: 'build__AuthController',
        registrationKey: 'authController',
        modulePath: 'controllers/authController.ts',
        relImport: '../../controllers/authController.js',
        contractName: 'AuthController',
        implementationName: 'authController',
        lifetime: 'singleton',
        moduleIndex: 1,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AuthQueryService'],
      },
    },
    AuthMiddleware: {
      authMiddleware: {
        exportName: 'build__AuthMiddleware',
        registrationKey: 'strictAuthMiddleware',
        modulePath: 'middleware/authMiddleware.ts',
        relImport: '../../middleware/authMiddleware.js',
        contractName: 'AuthMiddleware',
        implementationName: 'authMiddleware',
        lifetime: 'singleton',
        moduleIndex: 8,
        discoveredBy: 'naming',
        configOverridesApplied: ['name'],
        dependencyContractNames: ['TokenVerifier'],
      },
      optionalAuthMiddleware: {
        exportName: 'build__OptionalAuthMiddleware',
        registrationKey: 'optionalAuthMiddleware',
        modulePath: 'middleware/authMiddleware.ts',
        relImport: '../../middleware/authMiddleware.js',
        contractName: 'AuthMiddleware',
        implementationName: 'optionalAuthMiddleware',
        lifetime: 'singleton',
        moduleIndex: 8,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['default'],
        dependencyContractNames: ['TokenVerifier'],
      },
    },
    AuthQueryService: {
      authQueryService: {
        exportName: 'build__AuthQueryService',
        registrationKey: 'authQueryService',
        modulePath: 'services/authQueryService.ts',
        relImport: '../../services/authQueryService.js',
        contractName: 'AuthQueryService',
        implementationName: 'authQueryService',
        lifetime: 'singleton',
        moduleIndex: 17,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'Knex'],
      },
    },
    AuthService: {
      authService: {
        exportName: 'build__AuthService',
        registrationKey: 'authService',
        modulePath: 'services/authService.ts',
        relImport: '../../services/authService.js',
        contractName: 'AuthService',
        implementationName: 'authService',
        lifetime: 'scoped',
        moduleIndex: 18,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['lifetime'],
        dependencyContractNames: ['Config'],
      },
    },
    Config: {
      config: {
        exportName: 'build__Config',
        registrationKey: 'config',
        modulePath: 'config.ts',
        relImport: '../../config.js',
        contractName: 'Config',
        implementationName: 'config',
        lifetime: 'singleton',
        moduleIndex: 0,
        default: true,
        discoveredBy: 'naming',
      },
    },
    ErrorHandler: {
      errorHandler: {
        exportName: 'build__ErrorHandler',
        registrationKey: 'errorHandler',
        modulePath: 'middleware/errorHandler.ts',
        relImport: '../../middleware/errorHandler.js',
        contractName: 'ErrorHandler',
        implementationName: 'errorHandler',
        lifetime: 'singleton',
        moduleIndex: 9,
        default: true,
        discoveredBy: 'naming',
      },
    },
    GraphQLContextFactory: {
      createGraphQLContext: {
        exportName: 'build__CreateGraphQLContext',
        registrationKey: 'createGraphQLContext',
        modulePath: 'graphql/context/createGraphQLContext.ts',
        relImport: '../../graphql/context/createGraphQLContext.js',
        contractName: 'GraphQLContextFactory',
        implementationName: 'createGraphQLContext',
        lifetime: 'singleton',
        moduleIndex: 3,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    GraphQLServer: {
      graphQLServer: {
        exportName: 'build__GraphQLServer',
        registrationKey: 'graphQLServer',
        modulePath: 'graphql/server/createGraphQLServer.ts',
        relImport: '../../graphql/server/createGraphQLServer.js',
        contractName: 'GraphQLServer',
        implementationName: 'graphQLServer',
        lifetime: 'singleton',
        moduleIndex: 4,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['YogaApp'],
      },
    },
    Knex: {
      database: {
        exportName: 'build__Database',
        registrationKey: 'database',
        modulePath: 'knex.ts',
        relImport: '../../knex.js',
        contractName: 'Knex',
        implementationName: 'database',
        lifetime: 'singleton',
        moduleIndex: 5,
        default: true,
        discoveredBy: 'naming',
        configOverridesApplied: ['accessKey'],
        dependencyContractNames: ['Config', 'KnexConfig'],
        accessKey: 'database',
      },
    },
    KnexConfig: {
      knexConfig: {
        exportName: 'build__KnexConfig',
        registrationKey: 'knexConfig',
        modulePath: 'knexfile.ts',
        relImport: '../../knexfile.js',
        contractName: 'KnexConfig',
        implementationName: 'knexConfig',
        lifetime: 'singleton',
        moduleIndex: 6,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config'],
      },
    },
    KoaServer: {
      koaServer: {
        exportName: 'build__KoaServer',
        registrationKey: 'koaServer',
        modulePath: 'koaServer.ts',
        relImport: '../../koaServer.js',
        contractName: 'KoaServer',
        implementationName: 'koaServer',
        lifetime: 'singleton',
        moduleIndex: 7,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: [
          'AuthMiddleware',
          'Config',
          'ErrorHandler',
          'GraphQLServer',
          'Knex',
          'MediaPublicRouter',
          'RequestLogger',
          'RootRouter',
        ],
      },
    },
    MediaAuthMiddleware: {
      mediaAuthMiddleware: {
        exportName: 'build__MediaAuthMiddleware',
        registrationKey: 'mediaAuthMiddleware',
        modulePath: 'middleware/mediaAuthMiddleware.ts',
        relImport: '../../middleware/mediaAuthMiddleware.js',
        contractName: 'MediaAuthMiddleware',
        implementationName: 'mediaAuthMiddleware',
        lifetime: 'singleton',
        moduleIndex: 10,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'MediaGrantService'],
      },
    },
    MediaGrantService: {
      mediaGrantService: {
        exportName: 'build__MediaGrantService',
        registrationKey: 'mediaGrantService',
        modulePath: 'services/mediaGrantService.ts',
        relImport: '../../services/mediaGrantService.js',
        contractName: 'MediaGrantService',
        implementationName: 'mediaGrantService',
        lifetime: 'singleton',
        moduleIndex: 19,
        default: true,
        discoveredBy: 'naming',
      },
    },
    MediaPublicRouter: {
      mediaPublicRouter: {
        exportName: 'build__MediaPublicRouter',
        registrationKey: 'mediaPublicRouter',
        modulePath: 'routes/mediaPublicRouter.ts',
        relImport: '../../routes/mediaPublicRouter.js',
        contractName: 'MediaPublicRouter',
        implementationName: 'mediaPublicRouter',
        lifetime: 'singleton',
        moduleIndex: 15,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['MediaAuthMiddleware', 'MediaServeController'],
      },
    },
    MediaServeController: {
      mediaServeController: {
        exportName: 'build__MediaServeController',
        registrationKey: 'mediaServeController',
        modulePath: 'controllers/mediaServeController.ts',
        relImport: '../../controllers/mediaServeController.js',
        contractName: 'MediaServeController',
        implementationName: 'mediaServeController',
        lifetime: 'singleton',
        moduleIndex: 2,
        default: true,
        discoveredBy: 'naming',
      },
    },
    RequestLogger: {
      requestLogger: {
        exportName: 'build__RequestLogger',
        registrationKey: 'requestLogger',
        modulePath: 'middleware/requestLogger.ts',
        relImport: '../../middleware/requestLogger.js',
        contractName: 'RequestLogger',
        implementationName: 'requestLogger',
        lifetime: 'singleton',
        moduleIndex: 11,
        default: true,
        discoveredBy: 'naming',
      },
    },
    RootRouter: {
      apiRoutes: {
        exportName: 'build__ApiRoutes',
        registrationKey: 'apiRoutes',
        modulePath: 'routes/apiRouter.ts',
        relImport: '../../routes/apiRouter.js',
        contractName: 'RootRouter',
        implementationName: 'apiRoutes',
        lifetime: 'singleton',
        moduleIndex: 13,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Router'],
      },
    },
    Router: {
      router: {
        exportName: 'build__Router',
        registrationKey: 'router',
        modulePath: 'routes/authRouter.ts',
        relImport: '../../routes/authRouter.js',
        contractName: 'Router',
        implementationName: 'router',
        lifetime: 'singleton',
        moduleIndex: 14,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['AuthController', 'TokenHandshakeMiddleware'],
      },
    },
    Server: {
      server: {
        exportName: 'build__Server',
        registrationKey: 'server',
        modulePath: 'server.ts',
        relImport: '../../server.js',
        contractName: 'Server',
        implementationName: 'server',
        lifetime: 'singleton',
        moduleIndex: 16,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'KoaServer'],
      },
    },
    TokenHandshakeMiddleware: {
      tokenHandshakeMiddleware: {
        exportName: 'build__TokenHandshakeMiddleware',
        registrationKey: 'tokenHandshakeMiddleware',
        modulePath: 'middleware/tokenHandshakeMiddleware.ts',
        relImport: '../../middleware/tokenHandshakeMiddleware.js',
        contractName: 'TokenHandshakeMiddleware',
        implementationName: 'tokenHandshakeMiddleware',
        lifetime: 'singleton',
        moduleIndex: 12,
        default: true,
        discoveredBy: 'naming',
      },
    },
    TokenVerifier: {
      tokenVerifier: {
        exportName: 'build__TokenVerifier',
        registrationKey: 'tokenVerifier',
        modulePath: 'services/tokenVerifier.ts',
        relImport: '../../services/tokenVerifier.js',
        contractName: 'TokenVerifier',
        implementationName: 'tokenVerifier',
        lifetime: 'singleton',
        moduleIndex: 20,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'Knex'],
      },
    },
    YogaApp: {
      yogaApp: {
        exportName: 'build__YogaApp',
        registrationKey: 'yogaApp',
        modulePath: 'graphql/server/createGraphQLServer.ts',
        relImport: '../../graphql/server/createGraphQLServer.js',
        contractName: 'YogaApp',
        implementationName: 'yogaApp',
        lifetime: 'singleton',
        moduleIndex: 4,
        default: true,
        discoveredBy: 'naming',
        dependencyContractNames: ['Config', 'GraphQLContextFactory'],
      },
    },
  },
} as const satisfies IocGeneratedContainerManifest;

export const IOC_SCOPE_PROVIDED_KEYS = [] as const;
