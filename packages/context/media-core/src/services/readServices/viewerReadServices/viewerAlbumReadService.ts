import { AlbumMemberRole, OperationCatalog } from '@packages/contracts';
import { indexByUnique } from '@packages/infrastructure';
import { StandardEnumItem } from '@reharik/smart-enum';
import { AlbumReadRepository } from '../../../repositories/readRepositories/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { mapMediaItemRowToDBMediaItemRow } from '../readServiceMappers';
import {
  AlbumCollectionInfo,
  AlbumItemCollectionInfo,
  AlbumItemProjection,
  AlbumProjection,
  AlbumWithCoverRow,
  MediaItemProjection,
  PagedList,
} from '../types';
import { EnrichMediaItems } from './enrichMediaItems';

export interface ViewerAlbumReadService {
  listAlbums: (collectionInfo: AlbumCollectionInfo) => Promise<PagedList<AlbumProjection>>;
  getAlbum: (albumId: string) => Promise<AlbumProjection | undefined>;
  getViewableAlbumItems: (args: {
    albumId: string;
    collectionInfo: AlbumItemCollectionInfo;
  }) => Promise<PagedList<AlbumItemProjection>>;
}

export interface ViewerAlbumReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ViewerAlbumReadService;
}

export type SortableEnum = StandardEnumItem & { column: string };

type ViewerAlbumReadServiceFactoryDeps = {
  albumReadRepository: AlbumReadRepository;
  enrichMediaItems: EnrichMediaItems;
};

export const build__ViewerAlbumReadServiceFactory = ({
  albumReadRepository,
  enrichMediaItems,
}: ViewerAlbumReadServiceFactoryDeps): ViewerAlbumReadServiceFactory => {
  return ({ viewerId }: { viewerId: string }) => {
    const buildCover = (album: AlbumWithCoverRow) => {
      if (album.mediaItemId == null) {
        return undefined;
      }
      const cover = mapMediaItemRowToDBMediaItemRow(album);
      return {
        ...cover,
        tags: [],
        viewerReactions: [],
        reactionCounts: { total: 0, byEmoji: [] },
        // This is a mediaItem, however, it is special because it is
        // actually a feature of the album that can be added and removed but nothing else.
        operations:
          album.viewerMemberRole === AlbumMemberRole.owner ? album.viewerMemberRole.operations : [],
      };
    };

    return {
      listAlbums: async (
        collectionInfo: AlbumCollectionInfo,
      ): Promise<PagedList<AlbumProjection>> => {
        const albumsResult = await albumReadRepository.listByViewerId({
          viewerId,
          collectionInfo,
        });
        const coversMap = new Map<string, MediaItemProjection>();
        for (const album of albumsResult.nodes.filter((a) => a.mediaItemId != null)) {
          const cover = buildCover(album);
          if (cover) {
            coversMap.set(album.id, cover);
          }
        }
        const nodes = albumsResult.nodes.map((album) => ({
          id: album.id,
          title: album.title,
          itemCount: album.itemCount,
          createdAt: album.createdAt,
          updatedAt: album.updatedAt,
          viewerMemberRole: album.viewerMemberRole,
          coverMedia: coversMap.get(album.id),
          operations: album.viewerMemberRole?.operations ?? [],
        }));

        return {
          nodes,
          totalCount: albumsResult.totalCount,
        };
      },

      getAlbum: async (albumId: string): Promise<AlbumProjection | undefined> => {
        const row = await albumReadRepository.getAlbumForViewer({ albumId, viewerId });
        if (!row) {
          return undefined;
        }
        const coverMedia = buildCover(row);

        return {
          id: row.id,
          title: row.title,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          itemCount: row.itemCount,
          viewerMemberRole: row.viewerMemberRole,
          coverMedia,
          operations: row.viewerMemberRole?.operations ?? [],
        };
      },

      getViewableAlbumItems: async ({
        albumId,
        collectionInfo,
      }: {
        albumId: string;
        collectionInfo: AlbumItemCollectionInfo;
      }): Promise<PagedList<AlbumItemProjection>> => {
        const albumItemsResult = await albumReadRepository.getViewableAlbumItemsForViewer({
          albumId,
          viewerId,
          collectionInfo,
        });
        const dbMediaItems = albumItemsResult.nodes.map((albumItem) =>
          mapMediaItemRowToDBMediaItemRow(albumItem),
        );
        const enrichedMediaItems = indexByUnique(
          await enrichMediaItems.enrich(viewerId, dbMediaItems),
        );

        const nodes = albumItemsResult.nodes.map(
          (albumItem) =>
            ({
              id: albumItem.id,
              orderIndex: albumItem.albumItemOrderIndex,
              mediaItem: enrichedMediaItems.get(albumItem.mediaItemId),
              createdAt: albumItem.createdAt,
              updatedAt: albumItem.updatedAt,
              operations:
                enrichedMediaItems.get(albumItem.mediaItemId)?.ownerId === viewerId
                  ? OperationCatalog.albumItem.availableOperations
                  : [],
            }) as AlbumItemProjection,
        );
        return {
          nodes,
          totalCount: albumItemsResult.totalCount,
        };
      },
    };
  };
};
