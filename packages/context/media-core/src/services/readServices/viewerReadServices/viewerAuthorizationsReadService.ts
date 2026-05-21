import { AuthorizationReadRepository } from '../../../repositories/readRepositories/types';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { AuthorizationProjection } from '../types';

export interface viewerAuthorizationsReadService {
  listGrantedAuthorizationsForOwnedMediaItem: (args: {
    mediaItemId: EntityId;
  }) => Promise<AuthorizationProjection[]>;
  listGrantedAuthorizationsForOwnedAlbum: (args: {
    albumId: EntityId;
  }) => Promise<AuthorizationProjection[]>;
}

export interface viewerAuthorizationsReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): viewerAuthorizationsReadService;
}

type viewerAuthorizationsReadServiceFactoryDeps = {
  authorizationReadRepository: AuthorizationReadRepository;
};

export const build__viewerAuthorizationsReadServiceFactory = ({
  authorizationReadRepository,
}: viewerAuthorizationsReadServiceFactoryDeps): viewerAuthorizationsReadServiceFactory => {
  return ({ viewerId }: { viewerId: string }) => {
    return {
      listGrantedAuthorizationsForOwnedMediaItem: async ({
        mediaItemId,
      }: {
        mediaItemId: EntityId;
      }): Promise<AuthorizationProjection[]> => {
        const rows = await authorizationReadRepository.getGrantedAuthorizationsForOwnedMediaItem({
          mediaItemId,
          ownerId: viewerId,
        });
        return rows.map((row) => ({
          id: row.id,
          grantedToUserId: row.grantedToUser,
          operations: row.operations,
          label: row.description,
          expiresAt: row.expiresAt,
          revokedAt: row.revokedAt,
          createdAt: row.createdAt,
        }));
      },
      listGrantedAuthorizationsForOwnedAlbum: async ({
        albumId,
      }: {
        albumId: EntityId;
      }): Promise<AuthorizationProjection[]> => {
        const rows = await authorizationReadRepository.getGrantedAuthorizationsForOwnedAlbum({
          albumId,
          ownerId: viewerId,
        });
        return rows.map((row) => ({
          id: row.id,
          grantedToUserId: row.grantedToUser,
          operations: row.operations,
          label: row.description,
          expiresAt: row.expiresAt,
          revokedAt: row.revokedAt,
          createdAt: row.createdAt,
        }));
      },
    };
  };
};
