import { describe, expect, it, jest } from '@jest/globals';
import { AlbumItemSortBy, AlbumSortBy, SortDir } from '@packages/contracts';
import {
  build__ViewerAlbumReadServiceFactory,
  CollectionInfo,
  type AlbumCollectionInfo,
  type AlbumItemCollectionInfo,
  type AlbumItemWithMediaRow,
  type AlbumReadRepository,
  type AlbumWithCoverRow,
  type EnrichMediaItems,
  type PagedList,
} from '@packages/media-core';

describe('ViewerAlbumReadService (collection paging)', () => {
  const viewerId = 'viewer-paging-1';
  const albumId = 'album-paging-1';

  const noopEnrichMediaItems: EnrichMediaItems = {
    enrich: async (_viewerId, rows) =>
      rows.map((r) => ({
        ...r,
        tags: [],
        viewerReactions: [],
        reactionCounts: { total: 0, byEmoji: [] },
        operations: [],
      })),
    enrichPublic: async (_publicLinkId, rows) =>
      rows.map((r) => ({
        ...r,
        tags: [],
        viewerReactions: [],
        reactionCounts: { total: 0, byEmoji: [] },
        operations: [],
      })),
  };

  describe('When listAlbums is called with no collectionInfo fields', () => {
    it('should pass default paging and sort to the repository and return nodes plus totalCount', async () => {
      const listByViewerId = jest.fn(
        async (_params: {
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumSortBy>;
        }): Promise<PagedList<AlbumWithCoverRow>> => ({ nodes: [], totalCount: 0 }),
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'listByViewerId'> = {
        listByViewerId,
      };

      const factory = build__ViewerAlbumReadServiceFactory({
        albumReadRepository,
        enrichMediaItems: noopEnrichMediaItems,
      } as never);
      const service = factory({ viewerId });

      const result = await service.listAlbums({} as AlbumCollectionInfo);

      expect(listByViewerId).toHaveBeenCalledWith(
        expect.objectContaining({
          viewerId,
          collectionInfo: {},
        }),
      );
      expect(result.nodes).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('When listAlbums is called with explicit paging', () => {
    it('should forward resolved pageInfo and sort options to the repository and return nodes plus totalCount', async () => {
      const listByViewerId = jest.fn(
        async (_params: {
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumSortBy>;
        }): Promise<PagedList<AlbumWithCoverRow>> => ({ nodes: [], totalCount: 0 }),
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'listByViewerId'> = {
        listByViewerId,
      };

      const factory = build__ViewerAlbumReadServiceFactory({
        albumReadRepository,
        enrichMediaItems: noopEnrichMediaItems,
      } as never);
      const service = factory({ viewerId });

      const gqlCollection: AlbumCollectionInfo = {
        pageInfo: { limit: 7, offset: 14 },
        sortBy: AlbumSortBy.title,
        sortDir: SortDir.desc,
      };

      const result = await service.listAlbums(gqlCollection);

      expect(listByViewerId).toHaveBeenCalledWith({
        viewerId,
        collectionInfo: gqlCollection,
      });
      expect(result.nodes).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('When listAlbums returns albums without cover media', () => {
    it('should omit coverMedia on each node', async () => {
      /**
       * Row shape as returned by SQL left joins when no cover media exists.
       * Cast: repository row allows null joined columns; aggregate typing does not model SQL nulls.
       */
      const albumWithoutCover = {
        id: 'album-no-cover',
        title: 'No Cover',
        itemCount: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        mediaItemId: null,
        mediaItemOwnerId: null,
        mediaItemKind: null,
        mediaItemStatus: null,
        mediaItemMimeType: null,
        mediaItemSizeBytes: null,
        mediaItemWidth: null,
        mediaItemHeight: null,
        mediaItemDurationSeconds: null,
        mediaItemTitle: null,
        mediaItemDescription: null,
        mediaItemTakenAt: null,
        mediaItemCreatedAt: null,
        mediaItemUpdatedAt: null,
      } as unknown as AlbumWithCoverRow;

      const listByViewerId = jest.fn(
        async (_params: {
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumSortBy>;
        }): Promise<PagedList<AlbumWithCoverRow>> => ({
          nodes: [albumWithoutCover],
          totalCount: 1,
        }),
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'listByViewerId'> = {
        listByViewerId,
      };

      const factory = build__ViewerAlbumReadServiceFactory({
        albumReadRepository,
        enrichMediaItems: noopEnrichMediaItems,
      } as never);
      const service = factory({ viewerId });

      const gqlCollection: AlbumCollectionInfo = {
        pageInfo: { limit: 10, offset: 0 },
        sortBy: AlbumSortBy.title,
        sortDir: SortDir.asc,
      };

      const result = await service.listAlbums(gqlCollection);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]?.coverMedia).toBeUndefined();
    });
  });

  describe('When getViewableAlbumItems is called with no collectionInfo fields', () => {
    it('should pass default paging and sort to the repository and return nodes plus totalCount', async () => {
      const getViewableAlbumItemsForViewer = jest.fn(
        async (_params: {
          albumId: string;
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumItemSortBy>;
        }): Promise<PagedList<AlbumItemWithMediaRow>> => ({ nodes: [], totalCount: 0 }),
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'getViewableAlbumItemsForViewer'> = {
        getViewableAlbumItemsForViewer,
      };

      const factory = build__ViewerAlbumReadServiceFactory({
        albumReadRepository,
        enrichMediaItems: noopEnrichMediaItems,
      } as never);
      const service = factory({ viewerId });

      const result = await service.getViewableAlbumItems({
        albumId,
        collectionInfo: {} as AlbumItemCollectionInfo,
      });

      expect(getViewableAlbumItemsForViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          albumId,
          viewerId,
          collectionInfo: {},
        }),
      );
      expect(result.nodes).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('When getViewableAlbumItems is called with explicit paging', () => {
    it('should forward resolved pageInfo and sort options to the repository and return nodes plus totalCount', async () => {
      const getViewableAlbumItemsForViewer = jest.fn(
        async (_params: {
          albumId: string;
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumItemSortBy>;
        }): Promise<PagedList<AlbumItemWithMediaRow>> => ({ nodes: [], totalCount: 0 }),
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'getViewableAlbumItemsForViewer'> = {
        getViewableAlbumItemsForViewer,
      };

      const factory = build__ViewerAlbumReadServiceFactory({
        albumReadRepository,
        enrichMediaItems: noopEnrichMediaItems,
      } as never);
      const service = factory({ viewerId });

      const gqlCollection: AlbumItemCollectionInfo = {
        pageInfo: { limit: 4, offset: 8 },
        sortBy: AlbumItemSortBy.createdAt,
        sortDir: SortDir.asc,
      };

      const result = await service.getViewableAlbumItems({
        albumId,
        collectionInfo: gqlCollection,
      });

      expect(getViewableAlbumItemsForViewer).toHaveBeenCalledWith({
        albumId,
        viewerId,
        collectionInfo: gqlCollection,
      });
      expect(result.nodes).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});
