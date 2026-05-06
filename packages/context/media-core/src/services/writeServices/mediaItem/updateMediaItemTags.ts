import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { UpdateMediaItemTagsCommand, UpdateMediaItemTagsResult } from './writeMediaItem.types';

export interface UpdateMediaItemTags extends WriteServiceBase {
  (input: UpdateMediaItemTagsCommand): Promise<WriteResult<UpdateMediaItemTagsResult>>;
}

type UpdateMediaItemTagsDeps = {
  mediaItemRepository: MediaItemRepository;
};

export const build__UpdateMediaItemTags = ({
  mediaItemRepository,
}: UpdateMediaItemTagsDeps): UpdateMediaItemTags => {
  return async (
    input: UpdateMediaItemTagsCommand,
  ): Promise<WriteResult<UpdateMediaItemTagsResult>> => {
    const { viewerId, mediaItemId, tags } = input;

    const getResult = await loadRequiredMediaItem(mediaItemId, mediaItemRepository);
    if (!getResult.success) {
      return getResult;
    }
    const mediaItem = getResult.value;

    const ensureResult = ensureMediaItemOwnedByViewer(mediaItem.ownerId(), viewerId);
    if (!ensureResult.success) {
      return ensureResult;
    }

    const updateResult = mediaItem.replaceTags(tags, viewerId);
    if (!updateResult.success) {
      return updateResult;
    }
    await mediaItemRepository.save(mediaItem);

    return ok({
      mediaItemId: mediaItem.id(),
      tags: [...mediaItem.tags()],
    });
  };
};
