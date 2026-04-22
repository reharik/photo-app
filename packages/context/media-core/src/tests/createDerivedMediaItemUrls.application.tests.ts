import { describe, expect, it, jest } from '@jest/globals';
import { MediaAssetKind } from '@packages/contracts';
import type { MediaStorage } from '../application/media/MediaStorage';
import { buildMediaAssetStorageKey } from '../application/media/MediaStorage';
import { createDerivedMediaItemUrls } from '../application/media/buildDerivedMediaItemUrls';

const minimalMediaStorage = (): MediaStorage => ({
  getUploadTarget: async () => {
    throw new Error('not used');
  },
  writeObject: async () => {
    return;
  },
  deleteObject: async () => {
    return;
  },
  getObjectMetadata: async () => {
    return undefined;
  },
  verifyExistence: async () => false,
  getObjectAccessUrl: async ({ storageKey }) =>
    `https://test.example/obj/${encodeURIComponent(storageKey)}`,
  getObjectStream: async () => undefined,
  getObjectBuffer: async () => undefined,
});

describe('createDerivedMediaItemUrls', () => {
  describe('When invoked with a base storage key', () => {
    it('should return access URLs for thumbnail and display keys under that base', async () => {
      const baseStorageKey = 'm/k';
      const mediaStorage = minimalMediaStorage();
      const getObjectAccessUrl = jest.spyOn(mediaStorage, 'getObjectAccessUrl');
      const result = await createDerivedMediaItemUrls({
        mediaStorage,
        baseStorageKey,
      });
      const thumbnailKey = buildMediaAssetStorageKey(baseStorageKey, MediaAssetKind.thumbnail);
      const displayKey = buildMediaAssetStorageKey(baseStorageKey, MediaAssetKind.display);
      expect(getObjectAccessUrl).toHaveBeenCalledWith({ storageKey: thumbnailKey });
      expect(getObjectAccessUrl).toHaveBeenCalledWith({ storageKey: displayKey });
      expect(result).toEqual({
        thumbnail: `https://test.example/obj/${encodeURIComponent(thumbnailKey)}`,
        display: `https://test.example/obj/${encodeURIComponent(displayKey)}`,
      });
    });
  });
});
