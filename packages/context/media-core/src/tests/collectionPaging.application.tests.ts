import { describe, expect, it, jest } from '@jest/globals';
import { AlbumItemSortBy, AlbumSortBy, SortDir } from '@packages/contracts';
import {
  buildViewerAlbumReadServiceFactory,
  CollectionInfo,
  type AlbumCollectionInfo,
  type AlbumItemCollectionInfo,
  type AlbumItemWithMediaRow,
  type AlbumReadRepository,
  type AlbumWithCoverRow,
} from '@packages/media-core';

describe('ViewerAlbumReadService (collection paging)', () => {
  const viewerId = 'viewer-paging-1';
  const albumId = 'album-paging-1';

  const noopMediaItemReadRepository = {
    listTagsForMediaItemIds: async (): Promise<Map<string, string[]>> => new Map(),
  };

  describe('When listAlbums is called with no collectionInfo fields', () => {
    it('should pass default paging and sort to the repository and echo pageInfo in the projection', async () => {
      const listByViewerId = jest.fn(
        async (_params: {
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumSortBy>;
        }): Promise<AlbumWithCoverRow[]> => [],
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'listByViewerId'> = {
        listByViewerId,
      };

      const factory = buildViewerAlbumReadServiceFactory({
        albumReadRepository,
        mediaItemReadRepository: noopMediaItemReadRepository,
      } as never);
      const service = factory({ viewerId });

      const result = await service.listAlbums({} as AlbumCollectionInfo);

      expect(listByViewerId).toHaveBeenCalledWith(
        expect.objectContaining({
          viewerId,
          collectionInfo: {},
        }),
      );
      expect(result.pageInfo).toBeUndefined();
      expect(result.nodes).toEqual([]);
    });
  });

  describe('When listAlbums is called with explicit paging', () => {
    it('should forward resolved pageInfo and sort options to the repository', async () => {
      const listByViewerId = jest.fn(
        async (_params: {
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumSortBy>;
        }): Promise<AlbumWithCoverRow[]> => [],
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'listByViewerId'> = {
        listByViewerId,
      };

      const factory = buildViewerAlbumReadServiceFactory({
        albumReadRepository,
        mediaItemReadRepository: noopMediaItemReadRepository,
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
      expect(result.pageInfo).toEqual(gqlCollection.pageInfo);
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
        }): Promise<AlbumWithCoverRow[]> => [albumWithoutCover],
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'listByViewerId'> = {
        listByViewerId,
      };

      const factory = buildViewerAlbumReadServiceFactory({
        albumReadRepository,
        mediaItemReadRepository: noopMediaItemReadRepository,
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
    it('should pass default paging and sort to the repository and echo pageInfo in the projection', async () => {
      const getViewableAlbumItemsForViewer = jest.fn(
        async (_params: {
          albumId: string;
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumItemSortBy>;
        }): Promise<AlbumItemWithMediaRow[]> => [],
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'getViewableAlbumItemsForViewer'> = {
        getViewableAlbumItemsForViewer,
      };

      const factory = buildViewerAlbumReadServiceFactory({
        albumReadRepository,
        mediaItemReadRepository: noopMediaItemReadRepository,
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
      expect(result.pageInfo).toBeUndefined();
      expect(result.nodes).toEqual([]);
    });
  });

  describe('When getViewableAlbumItems is called with explicit paging', () => {
    it('should forward resolved pageInfo and sort options to the repository', async () => {
      const getViewableAlbumItemsForViewer = jest.fn(
        async (_params: {
          albumId: string;
          viewerId: string;
          collectionInfo: CollectionInfo<AlbumItemSortBy>;
        }): Promise<AlbumItemWithMediaRow[]> => [],
      );
      const albumReadRepository: Pick<AlbumReadRepository, 'getViewableAlbumItemsForViewer'> = {
        getViewableAlbumItemsForViewer,
      };

      const factory = buildViewerAlbumReadServiceFactory({
        albumReadRepository,
        mediaItemReadRepository: noopMediaItemReadRepository,
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
      expect(result.pageInfo).toEqual(gqlCollection.pageInfo);
    });
  });
});
