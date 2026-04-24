import { AppErrorCollection, MediaAssetKind } from '@packages/contracts';
import jwt from 'jsonwebtoken';
import type { Context, Next } from 'koa';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';

export type MediaAuthMiddleware = (ctx: Context, next: Next) => Promise<void>;

export const buildMediaAuthMiddleware =
  ({ mediaGrantService, config }: IocGeneratedCradle): MediaAuthMiddleware =>
  async (ctx: Context, next: Next): Promise<void> => {
    // Extract viewer identity from JWT — local verify, no DB hit
    let viewerId: string | undefined;
    const token = ctx.cookies.get('token');

    if (token) {
      try {
        const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
        viewerId = payload.userId;
      } catch {
        ctx.throw(401);
      }
    }

    const shareToken = ctx.query.token as string | undefined;

    if (!viewerId && !shareToken) ctx.throw(401);

    const decision = await mediaGrantService.authorizeView({
      mediaId: ctx.params.mediaId,
      variant: MediaAssetKind.fromKey(ctx.params.variant),
      viewerId,
      shareToken,
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

    ctx.state.authorizedMediaPath = decision.value;
    await next();
  };
