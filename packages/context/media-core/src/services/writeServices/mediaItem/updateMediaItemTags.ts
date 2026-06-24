import { ok, WriteResult } from '@packages/contracts';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { EntityId } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import {
  MediaItemTag,
  UpdateMediaItemTagsCommand,
  UpdateMediaItemTagsResult,
} from './writeMediaItem.types';

export interface UpdateMediaItemTags extends WriteServiceBase {
  (input: UpdateMediaItemTagsCommand): Promise<WriteResult<UpdateMediaItemTagsResult>>;
}

type UpdateMediaItemTagsDeps = {
  mediaItemRepository: MediaItemRepository;
};

const normalizeLabel = (label: string): string => label.trim().toLowerCase();

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

    // --- Phase 1: distill the incoming batch, then resolve every tag to a userTagId ---

    // Dedup by normalized label, preferring an entry that already has a userTagId.
    const distilledByLabel = new Map<string, { userTagId?: EntityId; label: string }>();
    for (const tag of tags) {
      const key = normalizeLabel(tag.label);
      const existing = distilledByLabel.get(key);
      if (!existing || (tag.userTagId != null && existing.userTagId == null)) {
        distilledByLabel.set(key, tag);
      }
    }

    // Resolve each distinct tag to a MediaItemTag with a concrete userTagId.
    const desiredTags: MediaItemTag[] = [];
    for (const tag of distilledByLabel.values()) {
      let userTagId = tag.userTagId;

      if (userTagId == null) {
        const normalized = normalizeLabel(tag.label);
        userTagId = await mediaItemRepository.ensureUserTagId({
          id: crypto.randomUUID(),
          userId: viewerId,
          label: normalized,
          createdBy: viewerId,
          createdAt: new Date(),
          updatedBy: viewerId,
          updatedAt: new Date(),
        });
      }

      desiredTags.push({
        mediaItemId,
        userTagId,
        label: normalizeLabel(tag.label), // or normalized — see note below
        createdBy: viewerId,
        createdAt: new Date(),
        updatedBy: viewerId,
        updatedAt: new Date(),
        // no `id` — the AR/repo assigns on insert
      });
    }

    // --- Phase 2: diff against current, apply, save ---

    const desiredByUserTagId = new Map(desiredTags.map((t) => [t.userTagId, t]));
    const currentTags = mediaItem.tags();
    const currentByUserTagId = new Map(currentTags.map((t) => [t.userTagId, t]));

    const toAdd = desiredTags.filter((t) => !currentByUserTagId.has(t.userTagId));
    const toRemove = currentTags
      .filter((t) => !desiredByUserTagId.has(t.userTagId))
      .map((t) => ({ mediaItemId: mediaItem.id(), userTagId: t.userTagId }));

    if (toAdd.length > 0) {
      mediaItem.addTags(toAdd);
    }
    if (toRemove.length > 0) {
      mediaItem.removeTags(toRemove);
    }

    await mediaItemRepository.save(mediaItem);
    return ok({
      mediaItemId: mediaItem.id(),
    });
  };
};
