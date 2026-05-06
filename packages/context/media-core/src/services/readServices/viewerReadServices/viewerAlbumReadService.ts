import { StandardEnumItem } from '@reharik/smart-enum';
import { AlbumReadRepository } from '../../../repositories/readRepositories/albumReadRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { MediaItemProjection } from './viewerMediaItemReadService.types';
import {
  AlbumCollectionInfo,
  AlbumItemCollectionInfo,
  AlbumItemListProjection,
  AlbumListProjection,
  AlbumProjection,
  NamespacedMediaItemRow,
} from './viewerReadService.types';

export interface ViewerAlbumReadService {
  listAlbums: (collectionInfo: AlbumCollectionInfo) => Promise<AlbumListProjection>;
  getAlbum: (albumId: string) => Promise<AlbumProjection | undefined>;
  getViewableAlbumItems: (args: {
    albumId: string;
    collectionInfo: AlbumItemCollectionInfo;
  }) => Promise<AlbumItemListProjection>;
}

export interface ViewerAlbumReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ViewerAlbumReadService;
}

const mapMediaItemRowToParent = (
  mediaItem: NamespacedMediaItemRow,
): Omit<MediaItemProjection, 'tags'> => {
  const id = mediaItem.mediaItemId ?? '';
  return {
    id,
    ownerId: mediaItem.mediaItemOwnerId ?? '',
    kind: mediaItem.mediaItemKind ?? '',
    status: mediaItem.mediaItemStatus ?? '',
    mimeType: mediaItem.mediaItemMimeType ?? '',
    sizeBytes: mediaItem.mediaItemSizeBytes ?? 0,
    originalFileName: mediaItem.mediaItemOriginalFileName ?? undefined,
    width: mediaItem.mediaItemWidth,
    height: mediaItem.mediaItemHeight,
    durationSeconds: mediaItem.mediaItemDurationSeconds,
    title: mediaItem.mediaItemTitle,
    description: mediaItem.mediaItemDescription,
    takenAt: mediaItem.mediaItemTakenAt,
    createdAt: mediaItem.mediaItemCreatedAt ?? new Date(),
    updatedAt: mediaItem.mediaItemUpdatedAt ?? new Date(),
  };
};

export type SortableEnum = StandardEnumItem & { column: string };

type ViewerAlbumReadServiceFactoryDeps = {
  albumReadRepository: AlbumReadRepository;
  mediaItemReadRepository: MediaItemReadRepository;
};

export const buildViewerAlbumReadServiceFactory = ({
  albumReadRepository,
  mediaItemReadRepository,
}: ViewerAlbumReadServiceFactoryDeps): ViewerAlbumReadServiceFactory => {
  return ({ viewerId }: { viewerId: string }) => {
    const enrichWithTags = async (
      items: Omit<MediaItemProjection, 'tags'>[],
    ): Promise<MediaItemProjection[]> => {
      if (items.length === 0) {
        return [];
      }
      const tagMap = await mediaItemReadRepository.listTagsForMediaItemIds({
        mediaItemIds: items.map((i) => i.id),
      });
      return items.map((item) => ({ ...item, tags: tagMap.get(item.id) ?? [] }));
    };

    return {
      listAlbums: async (collectionInfo: AlbumCollectionInfo): Promise<AlbumListProjection> => {
        const albums = await albumReadRepository.listByViewerId({
          viewerId,
          collectionInfo,
        });
        const coverBases = albums
          .filter((album) => album.mediaItemId != null)
          .map((album) => mapMediaItemRowToParent(album));
        const coversEnriched = await enrichWithTags(coverBases);
        const coverById = new Map(coversEnriched.map((c) => [c.id, c]));
        const nodes = albums.map((album) => ({
          id: album.id,
          title: album.title,
          createdAt: album.createdAt,
          updatedAt: album.updatedAt,
          coverMedia: album.mediaItemId != null ? coverById.get(album.mediaItemId) : undefined,
          viewerMemberRole: album.viewerMemberRole,
        }));

        return {
          nodes,
          pageInfo: collectionInfo.pageInfo,
        };
      },

      getAlbum: async (albumId: string): Promise<AlbumProjection | undefined> => {
        const row = await albumReadRepository.getAlbumForViewer({ albumId, viewerId });
        if (!row) {
          return undefined;
        }
        const cover =
          row.mediaItemId != null
            ? (await enrichWithTags([mapMediaItemRowToParent(row)]))[0]
            : undefined;
        return {
          id: row.id,
          title: row.title,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          viewerMemberRole: row.viewerMemberRole,
          coverMedia: cover,
        };
      },

      getViewableAlbumItems: async ({
        albumId,
        collectionInfo,
      }: {
        albumId: string;
        collectionInfo: AlbumItemCollectionInfo;
      }): Promise<AlbumItemListProjection> => {
        const albumItems = await albumReadRepository.getViewableAlbumItemsForViewer({
          albumId,
          viewerId,
          collectionInfo,
        });
        const mediaBases = albumItems.map((albumItem) => mapMediaItemRowToParent(albumItem));
        const mediaEnriched = await enrichWithTags(mediaBases);
        const nodes = albumItems.map((albumItem, index) => ({
          id: albumItem.id,
          orderIndex: albumItem.albumItemOrderIndex,
          mediaItem: mediaEnriched[index],
          createdAt: albumItem.createdAt,
          updatedAt: albumItem.updatedAt,
        }));
        return {
          nodes,
          pageInfo: collectionInfo.pageInfo,
        };
      },
    };
  };
};
