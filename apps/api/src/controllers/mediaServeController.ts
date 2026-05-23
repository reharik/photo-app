import type { MediaStorage } from '@packages/media-core';
import type { Context } from 'koa';

export type MediaServeController = {
  getMedia: (ctx: Context) => Promise<void>;
};

type MediaServeControllerDeps = {
  mediaStorage: MediaStorage;
};

export const build__MediaServeController = (
  _deps: MediaServeControllerDeps,
): MediaServeController => ({
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
