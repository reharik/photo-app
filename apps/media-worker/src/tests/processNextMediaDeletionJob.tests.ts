import { describe, expect, it, jest } from '@jest/globals';
import { MediaKind } from '@packages/contracts';
import type { MediaItemRepository } from '@packages/media-core';
import { MediaItem } from '@packages/media-core';

import { build__ProcessNextMediaDeletionJob } from '../tasks/mediaWorkers/processNextMediaDeletionJob.js';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const MEDIA_ITEM_ID = '33333333-3333-4333-8333-333333333333';

const createUploadedPhoto = (): MediaItem => {
  const ownerId = ACTOR_ID;
  const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
  item.completeUploadedWithMetadata(
    { sizeBytes: 10, mimeType: 'image/jpeg' },
    MediaKind.photo,
    ownerId,
  );
  return item;
};

describe('build__ProcessNextMediaDeletionJob', () => {
  describe('When deleteMediaItemIfPresent is called', () => {
    it('should return false when the media item row is missing', async () => {
      const processor = build__ProcessNextMediaDeletionJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(undefined),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.deleteMediaItemIfPresent(MEDIA_ITEM_ID)).resolves.toBe(false);
    });

    it('should delete and return true when the media item exists', async () => {
      const item = createUploadedPhoto();
      const deleteItem = jest.fn<MediaItemRepository['delete']>().mockResolvedValue(undefined);
      const processor = build__ProcessNextMediaDeletionJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save: jest.fn(),
          delete: deleteItem,
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.deleteMediaItemIfPresent(item.id())).resolves.toBe(true);
      expect(deleteItem).toHaveBeenCalledWith(item);
    });
  });
});
