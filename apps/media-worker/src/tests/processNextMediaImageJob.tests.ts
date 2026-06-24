import { describe, expect, it, jest } from '@jest/globals';
import { MediaItemStatus, MediaKind } from '@packages/contracts';
import type { MediaItemRepository } from '@packages/media-core';
import { MediaItem } from '@packages/media-core';

import { build__ProcessNextMediaImageJob } from '../application/processNextMediaImageJob.js';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const MEDIA_ITEM_ID = '33333333-3333-4333-8333-333333333333';

const createUploadedPhoto = (): MediaItem => {
  const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ACTOR_ID);
  item.completeUploadedWithMetadata(
    { sizeBytes: 10, mimeType: 'image/jpeg' },
    MediaKind.photo,
    ACTOR_ID,
  );
  return item;
};

describe('build__ProcessNextMediaImageJob', () => {
  describe('When loadForProcessing is called', () => {
    it('should return not_found when the media item is missing', async () => {
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(undefined),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.loadForProcessing(MEDIA_ITEM_ID)).resolves.toEqual({
        kind: 'not_found',
      });
    });

    it('should return already_ready when the item is ready', async () => {
      const item = createUploadedPhoto();
      item.markReadyAfterDerivatives({ displayWidth: 1, displayHeight: 1 }, ACTOR_ID);

      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await expect(processor.loadForProcessing(MEDIA_ITEM_ID)).resolves.toEqual({
        kind: 'already_ready',
      });
    });

    it('should return loaded when the item is processable', async () => {
      const item = createUploadedPhoto();
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn<MediaItemRepository['getById']>().mockResolvedValue(item),
          save: jest.fn(),
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      const result = await processor.loadForProcessing(MEDIA_ITEM_ID);
      expect(result.kind).toBe('loaded');
      if (result.kind === 'loaded') {
        expect(result.mediaItem.id()).toBe(item.id());
        expect(result.mediaItem.status().equals(MediaItemStatus.processing)).toBe(true);
      }
    });
  });

  describe('When saveProcessedItem is called', () => {
    it('should persist through the media item repository', async () => {
      const save = jest.fn<MediaItemRepository['save']>().mockResolvedValue(undefined);
      const item = createUploadedPhoto();
      const processor = build__ProcessNextMediaImageJob({
        mediaItemRepository: {
          getById: jest.fn(),
          save,
          delete: jest.fn(),
          ensureUserTagId: jest.fn(),
        },
      });

      await processor.saveProcessedItem(item);
      expect(save).toHaveBeenCalledWith(item);
    });
  });
});
