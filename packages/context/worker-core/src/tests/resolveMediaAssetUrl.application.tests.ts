import { describe, expect, it } from '@jest/globals';
import { MediaAssetKind } from '@packages/contracts';
import { resolveMediaAssetUrl } from '@packages/media-core';

describe('resolveMediaAssetUrl', () => {
  const mediaStorage = {
    getObjectAccessUrl: async (input: { storageKey: string }): Promise<string> =>
      `https://cdn.test/${input.storageKey}`,
  } as never;

  describe('When the requested asset kind is ready', () => {
    it('should return the requested asset url', async () => {
      const result = await resolveMediaAssetUrl({
        mediaStorage,
        baseStorageKey: 'media/viewer-1/item-1',
        requestedKind: MediaAssetKind.thumbnail,
        assets: [
          { kind: 'thumbnail', status: 'ready' },
          { kind: 'original', status: 'ready' },
        ],
      });

      expect(result.url).toBe('https://cdn.test/media/viewer-1/item-1/thumbnail');
      expect(result.resolvedKind).toBe(MediaAssetKind.thumbnail);
      expect(result.fallbackToOriginal).toBe(false);
    });
  });

  describe('When the requested asset kind is not ready', () => {
    it('should fallback to original asset url', async () => {
      const result = await resolveMediaAssetUrl({
        mediaStorage,
        baseStorageKey: 'media/viewer-1/item-1',
        requestedKind: MediaAssetKind.display,
        assets: [
          { kind: 'display', status: 'pending' },
          { kind: 'original', status: 'ready' },
        ],
      });

      expect(result.url).toBe('https://cdn.test/media/viewer-1/item-1/original');
      expect(result.resolvedKind).toBe(MediaAssetKind.original);
      expect(result.fallbackToOriginal).toBe(true);
    });
  });
});
