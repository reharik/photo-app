import { describe, expect, it } from '@jest/globals';
import { ContractError } from '@packages/contracts';

import { AlbumItem } from '../domain/Album/AlbumItem';
import {
  ALBUM_ITEM_ORDER_GAP,
  ALBUM_ITEM_ORDER_INITIAL,
  albumItemOrderIndexForOrdinal,
} from '../domain/Album/albumItemOrder';
import { reorderAlbumItems } from '../domain/utilities/reorderAlbumItems';
import { TEST_USER_A_ID } from './testViewerIds';

const ACTOR_ID = TEST_USER_A_ID;

const audit = {
  createdAt: new Date('2020-01-01T00:00:00.000Z'),
  updatedAt: new Date('2020-01-01T00:00:00.000Z'),
  createdBy: ACTOR_ID,
  updatedBy: ACTOR_ID,
};

const albumItem = (id: string, mediaItemId: string, orderIndex: bigint): AlbumItem =>
  AlbumItem.rehydrate({
    id,
    mediaItemId,
    orderIndex: String(orderIndex),
    ...audit,
  });

describe('reorderAlbumItems', () => {
  describe('When the ordered id list is a permutation of the items', () => {
    it('should assign sparse order indices in list order', () => {
      const id1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
      const id2 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
      const id3 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';

      const items = [
        albumItem(id1, 'm1', ALBUM_ITEM_ORDER_INITIAL),
        albumItem(id2, 'm2', ALBUM_ITEM_ORDER_INITIAL + ALBUM_ITEM_ORDER_GAP),
        albumItem(id3, 'm3', ALBUM_ITEM_ORDER_INITIAL + 2n * ALBUM_ITEM_ORDER_GAP),
      ];

      const result = reorderAlbumItems([id3, id1, id2], items, ACTOR_ID);

      expect(result.success).toBe(true);
      if (!result.success) {
        throw new Error('expected reorderAlbumItems to succeed');
      }

      expect(result.value.map((i) => i.id())).toEqual([id3, id1, id2]);
      expect(result.value[0]?.orderIndex()).toBe(albumItemOrderIndexForOrdinal(0));
      expect(result.value[1]?.orderIndex()).toBe(albumItemOrderIndexForOrdinal(1));
      expect(result.value[2]?.orderIndex()).toBe(albumItemOrderIndexForOrdinal(2));
    });
  });

  describe('When there is a single item', () => {
    it('should set ordinal zero order index', () => {
      const id1 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
      const items = [albumItem(id1, 'm1', 5n)];

      const result = reorderAlbumItems([id1], items, ACTOR_ID);

      expect(result.success).toBe(true);
      if (!result.success) {
        throw new Error('expected reorderAlbumItems to succeed');
      }
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.orderIndex()).toBe(albumItemOrderIndexForOrdinal(0));
    });
  });

  describe('When both lists are empty', () => {
    it('should return an empty success', () => {
      const result = reorderAlbumItems([], [], ACTOR_ID);
      expect(result).toEqual({ success: true, value: [] });
    });
  });

  describe('When ordered id count does not match item count', () => {
    it('should fail with InvalidAlbumItemOrder', () => {
      const id1 = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
      const items = [albumItem(id1, 'm1', ALBUM_ITEM_ORDER_INITIAL)];

      const result = reorderAlbumItems([id1, id1], items, ACTOR_ID);

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: ContractError.InvalidAlbumItemOrder.code,
        }),
      });
    });
  });

  describe('When the ordered list is empty but items are not', () => {
    it('should fail with InvalidAlbumItemOrder', () => {
      const id1 = 'dddddddd-dddd-4ddd-8ddd-dddddddddd01';
      const items = [albumItem(id1, 'm1', ALBUM_ITEM_ORDER_INITIAL)];

      const result = reorderAlbumItems([], items, ACTOR_ID);

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: ContractError.InvalidAlbumItemOrder.code,
        }),
      });
    });
  });

  describe('When the ordered list references an id that is not in items', () => {
    it('should fail with InvalidAlbumItemOrder', () => {
      const id1 = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
      const missing = 'ffffffff-ffff-4fff-8fff-fffffffffff1';
      const items = [albumItem(id1, 'm1', ALBUM_ITEM_ORDER_INITIAL)];

      const result = reorderAlbumItems([missing], items, ACTOR_ID);

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: ContractError.InvalidAlbumItemOrder.code,
        }),
      });
    });
  });

  describe('When the ordered list contains a duplicate id', () => {
    it('should fail with InvalidAlbumItemOrder', () => {
      const id1 = '11111111-2222-4333-8444-555555555551';
      const id2 = '11111111-2222-4333-8444-555555555552';
      const items = [
        albumItem(id1, 'm1', ALBUM_ITEM_ORDER_INITIAL),
        albumItem(id2, 'm2', ALBUM_ITEM_ORDER_INITIAL + ALBUM_ITEM_ORDER_GAP),
      ];

      const result = reorderAlbumItems([id1, id1], items, ACTOR_ID);

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: ContractError.InvalidAlbumItemOrder.code,
        }),
      });
    });
  });
});
