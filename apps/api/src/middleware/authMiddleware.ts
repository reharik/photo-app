import type { Logger } from '@packages/infrastructure';
import { type PublicAccessReadService } from '@packages/media-core';
import type { Context, Next } from 'koa';

import type { TokenVerifier } from '../services/tokenVerifier.js';

export type AuthMiddleware = (ctx: Context, next: Next) => Promise<void>;
export type OptionalAuthMiddleware = AuthMiddleware;

type AuthMiddlewareDeps = {
  tokenVerifier: TokenVerifier;
  logger: Logger;
};

export const build__AuthMiddleware =
  ({ tokenVerifier, logger }: AuthMiddlewareDeps): AuthMiddleware =>
  async (ctx: Context, next: Next) => {
    const authHeader = ctx.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: missing or invalid authorization header', {
        method: ctx.method,
        path: ctx.path,
        hasHeader: !!authHeader,
      });
      ctx.status = 401;
      ctx.body = { error: 'Authorization header required' };
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await tokenVerifier.verifyJWTToken(token);
    if (!user) {
      logger.warn('Authentication failed: invalid or expired token', {
        method: ctx.method,
        path: ctx.path,
      });
      ctx.status = 401;
      ctx.body = { error: 'Invalid or expired token' };
      return;
    }

    // Add user directly on context for easy access
    ctx.state.user = user;
    ctx.state.isLoggedIn = true;

    await next();
  };

type OptionalAuthMiddlewareDeps = {
  tokenVerifier: TokenVerifier;
  publicAccessReadService: PublicAccessReadService;
};

export const build__OptionalAuthMiddleware =
  ({
    tokenVerifier,
    publicAccessReadService,
  }: OptionalAuthMiddlewareDeps): OptionalAuthMiddleware =>
  async (ctx: Context, next: Next) => {
    const token = ctx.cookies.get('token');
    ctx.isLoggedIn = false;

    if (token) {
      const user = await tokenVerifier.verifyJWTToken(token);
      if (user) {
        ctx.state.user = user;
        ctx.state.isLoggedIn = true;
      }
    }

    const publicToken = ctx.cookies.get('public');
    if (publicToken) {
      const publicAccessId = await publicAccessReadService.validateToken(publicToken);
      ctx.state.publicAccessId = publicAccessId;
    }
    await next();
  };
