import { AlbumMemberRole } from '@packages/contracts';
import { SharedWithMeReadRepository } from '../../../repositories/readRepositories/sharedWithMeReadRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { SharedWithMeItemProjection } from './viewerAlbumReadService.types';
import { mapNamespacedToMediaItemBase } from './viewerSharedWithMeMediaItemReadService';

export type SharedWithMeAlbumProjection = {
  id: EntityId;
  sharedAt: Date;
  sharedBy: EntityId;
  viewerMemberRole?: AlbumMemberRole;
  title: string;
  description?: string;
  coverMediaId?: string;
  coverMedia?: SharedWithMeItemProjection;
  createdAt: Date;
  updatedAt: Date;
};

export interface ViewerSharedWithMeAlbumReadService {
  getSharedWithMeAlbums: () => Promise<{
    albums: SharedWithMeAlbumProjection[];
  }>;
}

export interface ViewerSharedWithMeAlbumReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: EntityId }): ViewerSharedWithMeAlbumReadService;
}

type ViewerSharedWithMeAlbumReadServiceFactoryDeps = {
  sharedWithMeReadRepository: SharedWithMeReadRepository;
};

export const build__ViewerSharedWithMeAlbumReadServiceFactory = ({
  sharedWithMeReadRepository,
}: ViewerSharedWithMeAlbumReadServiceFactoryDeps): ViewerSharedWithMeAlbumReadServiceFactory => {
  return ({ viewerId }: { viewerId: EntityId }) => ({
    getSharedWithMeAlbums: async (): Promise<{ albums: SharedWithMeAlbumProjection[] }> => {
      const { sharedWithMeAlbums: flatAlbums } =
        await sharedWithMeReadRepository.getAlbumsSharedWithMe(viewerId);

      const albums = flatAlbums.map((album) => ({
        id: album.albumId,
        viewerMemberRole: album.viewerMemberRole,
        title: album.albumTitle,
        createdAt: album.albumCreatedAt,
        updatedAt: album.albumUpdatedAt,
        sharedAt: album.sharedAt,
        sharedBy: album.sharedBy,
        coverMedia: { ...mapNamespacedToMediaItemBase(album), tags: [] },
      }));

      return { albums };
    },
  });
};
