import type { Context } from 'koa';
import type { AppCradle } from '../di/generated/ioc-composed.js';
export type MediaServeController = {
  getMedia: (ctx: Context) => Promise<void>;
};

export const build__MediaServeController = (_deps: AppCradle): MediaServeController => ({
  getMedia: async (ctx: Context): Promise<void> => {
    if (!ctx.state.authorizedMediaPath) {
      ctx.throw(500, 'Media authorization state missing');
    }
    const url = await _deps.mediaStorage.getObjectAccessUrl({
      storageKey: ctx.state.authorizedMediaPath,
    });
    ctx.redirect(url);
  },
});
