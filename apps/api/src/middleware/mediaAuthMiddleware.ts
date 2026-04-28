import { AppErrorCollection, MediaAssetKind } from '@packages/contracts';
import { buildMediaAssetStorageKey, hashToken } from '@packages/media-core';
import jwt from 'jsonwebtoken';
import type { Context, Next } from 'koa';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type MediaAuthMiddleware = (ctx: Context, next: Next) => Promise<void>;

export const buildMediaAuthMiddleware =
  ({ mediaGrantService, config }: IocGeneratedCradle): MediaAuthMiddleware =>
  async (ctx: Context, next: Next): Promise<void> => {
    // Extract viewer identity from JWT — local verify, no DB hit
    const token = ctx.cookies.get('token');

    let payload: { userId?: string; token?: string } | undefined;
    if (token) {
      try {
        payload = jwt.verify(token, config.jwtSecret) as { userId?: string; token?: string };
      } catch {
        ctx.throw(401);
      }
    }

    const hashedToken = payload?.token ? hashToken(payload.token) : undefined;
    const viewerId = payload?.userId || hashedToken;
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
