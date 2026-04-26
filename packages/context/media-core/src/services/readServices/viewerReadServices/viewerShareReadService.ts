import {
  ShareContactRepository,
  ShareContactSuggestion,
} from '../../../repositories/readRepositories/shareContactRepository';
import { ShareReadRepository } from '../../../repositories/readRepositories/shareReadRepository';
import type { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';

export type ShareProjection = {
  id: EntityId;
  grantedToUserId?: EntityId;
  permission: string;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
};

export interface ViewerShareReadService {
  getMediaItemShares: (args: { mediaItemId: EntityId }) => Promise<ShareProjection[]>;
  getAlbumShares: (args: { albumId: EntityId }) => Promise<ShareProjection[]>;
  getShareContacts: () => Promise<ShareContactSuggestion[]>;
}

export interface ViewerShareReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: EntityId }): ViewerShareReadService;
}

type ViewerShareReadServiceFactoryDeps = {
  shareReadRepository: ShareReadRepository;
  shareContactRepository: ShareContactRepository;
};

export const buildViewerShareReadServiceFactory = ({
  shareReadRepository,
  shareContactRepository,
}: ViewerShareReadServiceFactoryDeps): ViewerShareReadServiceFactory => {
  return ({ viewerId }: { viewerId: EntityId }) => ({
    getMediaItemShares: async ({
      mediaItemId,
    }: {
      mediaItemId: EntityId;
    }): Promise<ShareProjection[]> => {
      const rows = await shareReadRepository.listSharesForOwnedMediaItem({
        mediaItemId,
        ownerId: viewerId,
      });
      return rows.map((row) => ({
        id: row.id,
        grantedToUserId: row.grantedToUser,
        permission: row.permission.value,
        label: row.description,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      }));
    },
    getAlbumShares: async ({ albumId }: { albumId: EntityId }): Promise<ShareProjection[]> => {
      const rows = await shareReadRepository.listSharesForOwnedAlbum({
        albumId,
        ownerId: viewerId,
      });
      return rows.map((row) => ({
        id: row.id,
        grantedToUserId: row.grantedToUser,
        permission: row.permission.value,
        label: row.description,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      }));
    },
    getShareContacts: async (): Promise<ShareContactSuggestion[]> => {
      return shareContactRepository.getShareSuggestions(viewerId);
    },
  });
};
