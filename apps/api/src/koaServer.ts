import cors from '@koa/cors';
import { setDefaultSerializationMode } from '@reharik/smart-enum';
import http from 'http';
import type { Knex } from 'knex';
import Koa, { Context } from 'koa';
import { koaBody } from 'koa-body';

import { Logger } from '@packages/infrastructure';
import type { Config } from './config.js';
import type { GraphQLServer } from './graphql/server/createGraphQLServer.js';
import { ApiRequestContextMiddleware } from './middleware/apiRequestContextMiddleware.js';
import type { AuthMiddleware } from './middleware/authMiddleware.js';
import type { ErrorHandler } from './middleware/errorHandler.js';
import { RequestIdMiddleware } from './middleware/requestIdMiddleware.js';
import type { RequestLogger } from './middleware/requestLogger.js';
import type { APIRouter } from './routes/apiRouter.js';
import type { MediaPublicRouter } from './routes/mediaPublicRouter.js';

setDefaultSerializationMode('value');

// then the rest of your app bootstrap
export type KoaServer = http.Server;

type KoaServerDeps = {
  mediaPublicRouter: MediaPublicRouter;
  apiRouter: APIRouter;
  authMiddleware: AuthMiddleware;
  logger: Logger;
  graphQlServer: GraphQLServer;
  errorHandler: ErrorHandler;
  requestLogger: RequestLogger;
  database: Knex;
  config: Config;
  apiRequestContextMiddleware: ApiRequestContextMiddleware;
  requestIdMiddleware: RequestIdMiddleware;
};

export const build__KoaServer = ({
  mediaPublicRouter,
  apiRouter,
  authMiddleware,
  logger,
  apiRequestContextMiddleware,
  graphQlServer,
  errorHandler,
  requestLogger,
  database,
  config,
  requestIdMiddleware,
}: KoaServerDeps): KoaServer => {
  const app = new Koa();
  app.proxy = config.trustProxy;
  app.context.db = database;
  // 1. RequestId generation ( should be first, so request Id can be on error )
  app.use(requestIdMiddleware);

  // 2. Error handling (should be immediately after requestId )
  app.use(errorHandler);

  // 3. Request logging (early in pipeline)
  app.use(requestLogger);

  // 4. CORS (before body parsing)
  app.use(
    cors({
      origin: (ctx): string => {
        const requestOrigin = ctx.get('Origin');

        if (!requestOrigin) {
          return '';
        }
        return config.corsOrigins.includes(requestOrigin) ? requestOrigin : '';
      },
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'X-Requested-With', 'X-Access-Mode'],
    }),
  );

  // 5. Body parsing (must be before request processing)
  app.use(koaBody());

  // 6. Add IOC request context container
  app.use(apiRequestContextMiddleware);

  // 7. Public media fetch route (optional auth + resource authz; no global login requirement)
  // Fires before auth middleware because this has a custom authz logic
  app.use(mediaPublicRouter.routes()).use(mediaPublicRouter.allowedMethods());

  // 8. Auth middleware (required for API routes below)
  app.use(authMiddleware);

  // 9. Routes (the actual request handling)

  app.use(apiRouter.routes()).use(apiRouter.allowedMethods());

  // 10. GraphQL endpoint
  app.use(graphQlServer);

  // Health check endpoint (no /api prefix, no auth required)
  app.use(async (ctx, next) => {
    if (ctx.path === '/health') {
      ctx.status = 200;
      ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'homeroll-api',
      };
      return;
    }
    await next();
  });

  app.on('error', (err: unknown, ctx?: Context) => {
    const error = err instanceof Error ? err : new Error(String(err));

    const requestId =
      ctx && 'req' in ctx ? (ctx.req?.headers['x-request-id'] as string | undefined) : undefined;

    logger.error(
      `Unhandled error${ctx ? ` on ${ctx.method ?? 'unknown'} ${ctx.path ?? ''}` : ''}`,
      error,
      {
        status: ctx?.status,
        requestId,
        method: ctx?.method,
        path: ctx?.path,
      },
    );
  });

  return http.createServer(app.callback());
};
