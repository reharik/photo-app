import { AppErrorCollection, MediaAssetKind } from '@packages/contracts';
import { buildMediaAssetStorageKey, hashToken } from '@packages/media-core';
import jwt from 'jsonwebtoken';
import type { Context, Next } from 'koa';
import type { Config } from '../config.js';
import type { MediaGrantService } from '../services/mediaGrantService.js';

export type MediaAuthMiddleware = (ctx: Context, next: Next) => Promise<void>;

type MediaAuthMiddlewareDeps = {
  mediaGrantService: MediaGrantService;
  config: Config;
};

export const build__MediaAuthMiddleware =
  ({ mediaGrantService, config }: MediaAuthMiddlewareDeps): MediaAuthMiddleware =>
  async (ctx: Context, next: Next): Promise<void> => {
    // Extract viewer identity from JWT — local verify, no DB hit
    const token = ctx.cookies.get('token');
    const publicToken = ctx.cookies.get('public');
    let payload: { userId?: string; token?: string } | undefined;
    if (token) {
      try {
        payload = jwt.verify(token, config.jwtSecret) as { userId?: string };
      } catch {
        ctx.throw(401);
      }
    } else if (publicToken) {
      payload = { token: publicToken };
    }
    const hashedToken = payload?.token ? hashToken(payload.token) : undefined;
    const viewerId = payload?.userId;
    const { mediaId, variant } = ctx.params as { mediaId: string; variant: string };
    if (!viewerId && !hashedToken) ctx.throw(401);

    const decision = await mediaGrantService.authorizeView({
      mediaId,
      viewerId,
      hashedToken,
    });

    if (!decision.success) {
      switch (decision.error) {
        case AppErrorCollection.mediaItem.MediaItemNotFound:
          ctx.throw(404, decision.error.display);
          return;
        case AppErrorCollection.mediaItem.InvalidMediaAssetKind:
          ctx.throw(400, decision.error.display);
          return;
        case AppErrorCollection.mediaItem.MediaItemNotAuthorized:
        default:
          ctx.throw(403, decision.error.display);
          return;
      }
    }

    const s3Url = buildMediaAssetStorageKey(decision.value, MediaAssetKind.fromKey(variant));
    ctx.state.authorizedMediaPath = s3Url;
    await next();
  };
