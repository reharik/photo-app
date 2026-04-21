import { describe, expect, it } from '@jest/globals';
import { AppErrorCollection, MediaItemStatus, MediaKind } from '@packages/contracts';
import {
  ALBUM_ITEM_ORDER_GAP,
  ALBUM_ITEM_ORDER_INITIAL,
  Album,
  MediaItem,
} from '@packages/media-core';
import { TEST_OWNER_1_ID, TEST_USER_A_ID } from './testViewerIds';

describe('MediaItem (domain)', () => {
  describe('When created', () => {
    it('should start in pending status', () => {
      const ownerId = TEST_USER_A_ID;
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
      expect(item.status()).toBe(MediaItemStatus.pending);
    });
  });

  describe('When completeUploadedWithMetadata is called from pending', () => {
    it('should transition to uploaded without dimensions', () => {
      const ownerId = TEST_USER_A_ID;
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
      const result = item.completeUploadedWithMetadata(
        { sizeBytes: 100, mimeType: 'image/png' },
        ownerId,
      );
      expect(result.success).toBe(true);
      expect(item.status()).toBe(MediaItemStatus.uploaded);
      expect(item.sizeBytes()).toBe(100);
      expect(item.mimeType()).toBe('image/png');
      expect(item.width()).toBeUndefined();
      expect(item.height()).toBeUndefined();
    });
  });

  describe('When markReadyAfterDerivatives is called from uploaded with display dimensions', () => {
    it('should transition to ready and set width and height from the display derivative', () => {
      const ownerId = TEST_USER_A_ID;
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
      item.completeUploadedWithMetadata({ sizeBytes: 5000, mimeType: 'image/jpeg' }, ownerId);
      const result = item.markReadyAfterDerivatives(
        { displayWidth: 1200, displayHeight: 800 },
        ownerId,
      );
      expect(result.success).toBe(true);
      expect(item.status()).toBe(MediaItemStatus.ready);
      expect(item.width()).toBe(1200);
      expect(item.height()).toBe(800);
    });
  });

  describe('When markReadyAfterDerivatives is called but the item is not uploaded', () => {
    it('should fail with status not pending', () => {
      const ownerId = TEST_USER_A_ID;
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
      const result = item.markReadyAfterDerivatives({ displayWidth: 1, displayHeight: 1 }, ownerId);
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: AppErrorCollection.mediaItem.StatusNotPending.code,
        }),
      });
    });
  });

  describe('When markReadyAfterDerivatives is called again after the item is already ready', () => {
    it('should fail with status not pending', () => {
      const ownerId = TEST_USER_A_ID;
      const item = MediaItem.create({ kind: MediaKind.photo, mimeType: 'image/jpeg' }, ownerId);
      item.completeUploadedWithMetadata({ sizeBytes: 1, mimeType: 'image/jpeg' }, ownerId);
      const first = item.markReadyAfterDerivatives(
        { displayWidth: 10, displayHeight: 10 },
        ownerId,
      );
      expect(first.success).toBe(true);
      const second = item.markReadyAfterDerivatives(
        { displayWidth: 20, displayHeight: 20 },
        ownerId,
      );
      expect(second).toEqual({
        success: false,
        error: expect.objectContaining({
          code: AppErrorCollection.mediaItem.StatusNotPending.code,
        }),
      });
    });
  });
});

describe('Album (domain)', () => {
  const ownerId = TEST_OWNER_1_ID;

  describe('When addItem is called with duplicate media', () => {
    it('should reject the second add with media already in album', () => {
      const album = Album.create({ title: 'Trip' }, ownerId);
      const mediaId = 'media-1';
      const first = album.addItem(mediaId, ownerId);
      expect(first.success).toBe(true);
      if (!first.success) {
        throw new Error('expected first addItem to succeed');
      }
      expect(first.value.orderIndex()).toBe(ALBUM_ITEM_ORDER_INITIAL);
      const second = album.addItem(mediaId, ownerId);
      expect(second).toEqual({
        success: false,
        error: expect.objectContaining({
          code: AppErrorCollection.album.MediaAlreadyInAlbum.code,
        }),
      });
    });
  });

  describe('When addItem is called twice for different media', () => {
    it('should assign increasing sparse order indices', () => {
      const album = Album.create({ title: 'Trip' }, ownerId);
      const a = album.addItem('media-a', ownerId);
      const b = album.addItem('media-b', ownerId);
      expect(a.success).toBe(true);
      expect(b.success).toBe(true);
      if (!a.success || !b.success) {
        throw new Error('expected both addItem calls to succeed');
      }
      expect(a.value.orderIndex()).toBe(ALBUM_ITEM_ORDER_INITIAL);
      expect(b.value.orderIndex()).toBe(ALBUM_ITEM_ORDER_INITIAL + ALBUM_ITEM_ORDER_GAP);
    });
  });

  describe('When setCoverMedia targets media that is not an album item', () => {
    it('should fail without an independent readiness check in the aggregate API', () => {
      const album = Album.create({ title: 'Trip' }, ownerId);
      const r = album.setCoverMedia('not-in-album', ownerId);
      expect(r).toEqual({
        success: false,
        error: expect.objectContaining({
          code: AppErrorCollection.album.CoverMediaNotPartOfAlbum.code,
        }),
      });
    });
  });

  describe('When setCoverMedia targets media that is already represented as an album item', () => {
    it('should succeed based on membership only', () => {
      const album = Album.create({ title: 'Trip' }, ownerId);
      const mediaId = 'media-cover';
      const add = album.addItem(mediaId, ownerId);
      expect(add.success).toBe(true);
      const r = album.setCoverMedia(mediaId, ownerId);
      expect(r.success).toBe(true);
    });
  });

  describe('When reorderItems is called with a full permutation', () => {
    it('should assign new sparse indices in list order', () => {
      const album = Album.create({ title: 'Trip' }, ownerId);
      const a = album.addItem('m1', ownerId);
      const b = album.addItem('m2', ownerId);
      const c = album.addItem('m3', ownerId);
      expect(a.success && b.success && c.success).toBe(true);
      if (!a.success || !b.success || !c.success) {
        throw new Error('expected all addItem calls to succeed');
      }
      const id1 = a.value.id();
      const id2 = b.value.id();
      const id3 = c.value.id();
      const r = album.reorderItems([id3, id1, id2], ownerId);
      expect(r.success).toBe(true);
      const items = album.toPersistence().items as { id: string; orderIndex: string }[];
      const byId = new Map(items.map((it) => [it.id, it.orderIndex]));
      expect(byId.get(id3)! < byId.get(id1)!).toBe(true);
      expect(byId.get(id1)! < byId.get(id2)!).toBe(true);
    });
  });

  describe('When removeMediaItemFromAlbum targets media that is the cover', () => {
    it('should remove the album item and clear the cover', () => {
      const album = Album.create({ title: 'Trip' }, ownerId);
      const mediaId = 'media-a';
      const add = album.addItem(mediaId, ownerId);
      expect(add.success).toBe(true);
      const cover = album.setCoverMedia(mediaId, ownerId);
      expect(cover.success).toBe(true);

      const removed = album.removeMediaItemFromAlbum(mediaId, ownerId);
      expect(removed.success).toBe(true);
      expect(album.toPersistence().items).toHaveLength(0);
      expect(album.coverMediaId()).toBeUndefined();
    });
  });

  describe('When removeMediaItemFromAlbum targets media that is not the cover', () => {
    it('should remove only that album item and leave the cover unchanged', () => {
      const album = Album.create({ title: 'Trip' }, ownerId);
      const a = album.addItem('keep-cover', ownerId);
      const b = album.addItem('remove-me', ownerId);
      expect(a.success && b.success).toBe(true);
      if (!a.success || !b.success) {
        throw new Error('expected both addItem calls to succeed');
      }
      const cover = album.setCoverMedia('keep-cover', ownerId);
      expect(cover.success).toBe(true);

      const removed = album.removeMediaItemFromAlbum('remove-me', ownerId);
      expect(removed.success).toBe(true);
      expect(album.toPersistence().items).toHaveLength(1);
      expect(album.coverMediaId()).toBe('keep-cover');
    });
  });

  describe('When removeMediaItemFromAlbum targets media that is not in the album', () => {
    it('should leave items unchanged', () => {
      const album = Album.create({ title: 'Trip' }, ownerId);
      const add = album.addItem('only-one', ownerId);
      expect(add.success).toBe(true);

      const beforeItems = album.toPersistence().items.length;
      const removed = album.removeMediaItemFromAlbum('not-present', ownerId);
      expect(removed.success).toBe(true);
      expect(album.toPersistence().items).toHaveLength(beforeItems);
    });
  });
});
