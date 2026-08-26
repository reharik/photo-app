import {
  MediaItemRepository,
  MediaProcessingJobRepository,
  UnitOfWork,
} from '@packages/media-core';
import { OpenMediaJobContextScope } from '../../../../generated/ioc-registry.types';

export interface InJobScope {
  <T>(fn: (ctx: MediaJobContext) => Promise<{ commit: boolean; value: T }>): Promise<T>;
}

export type MediaJobContext = {
  mediaItemRepository: MediaItemRepository;
  mediaProcessingJobRepository: MediaProcessingJobRepository;
  uow: UnitOfWork;
  start: () => Promise<void>;
  finalize: (ok: boolean) => Promise<void>;
};

type InJobScopeDeps = {
  openMediaJobContextScope: OpenMediaJobContextScope;
};

// inJobScope.ts
export const build__InJobScope =
  ({ openMediaJobContextScope }: InJobScopeDeps): InJobScope =>
  async <T>(fn: (ctx: MediaJobContext) => Promise<{ commit: boolean; value: T }>): Promise<T> => {
    const { mediaJobContext: ctx, dispose } = openMediaJobContextScope();
    await ctx.start();
    try {
      const { commit, value } = await fn(ctx);
      await ctx.finalize(commit);
      return value;
    } catch (e) {
      await ctx.finalize(false);
      throw e;
    } finally {
      await dispose();
    }
  };
