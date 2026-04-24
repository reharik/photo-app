import type { Context } from 'koa';
import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
export type MediaServeController = {
  getMedia: (ctx: Context) => Promise<void>;
};

export const buildMediaServeController = (_deps: IocGeneratedCradle): MediaServeController => ({
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
