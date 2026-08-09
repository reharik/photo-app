import {
  AuthorizationReadRepository,
  EmailShare,
} from '../../../repositories/readRepositories/types';
import { EntityId } from '../../../types/types';
import { ReadServiceBase } from '../readServiceBaseType';
import { AuthorizationProjection } from '../types';

export interface viewerAuthorizationsReadService extends ReadServiceBase {
  listGrantedAuthorizationsForOwnedMediaItem: (args: {
    mediaItemId: EntityId;
  }) => Promise<AuthorizationProjection[]>;
  listEmailSharesForAlbum: (args: { albumId: EntityId }) => Promise<EmailShare[]>;
  getPublicLinkTokenForAlbum: (args: {
    albumId: EntityId;
  }) => Promise<{ token: string | undefined }>;
}

type viewerAuthorizationsReadServiceDeps = {
  authorizationReadRepository: AuthorizationReadRepository;
  viewerId: string;
};

export const build__viewerAuthorizationsReadService = ({
  authorizationReadRepository,
  viewerId,
}: viewerAuthorizationsReadServiceDeps): viewerAuthorizationsReadService => {
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
    listEmailSharesForAlbum: async ({ albumId }: { albumId: EntityId }): Promise<EmailShare[]> => {
      return authorizationReadRepository.getPendingEmailAuthorizationsForAlbum({
        albumId,
        viewerId,
      });
    },
    getPublicLinkTokenForAlbum: async ({
      albumId,
    }: {
      albumId: EntityId;
    }): Promise<{ token: string | undefined }> => {
      const row = await authorizationReadRepository.getPublicAuthorizationByAlbum({
        albumId,
        viewerId,
      });
      return { token: row ? row.linkToken : undefined };
    },
  };
};
