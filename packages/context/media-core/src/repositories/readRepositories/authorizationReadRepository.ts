import { SharePermission } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type { EntityId } from '../../types/types';

export type AuthorizationRow = {
  id: EntityId;
  grantedToUser?: EntityId;
  permission: SharePermission;
  description?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
};

export type AuthorizationReadRepository = {
  getGrantedAuthorizationsForOwnedMediaItem: (args: {
    mediaItemId: EntityId;
    ownerId: EntityId;
  }) => Promise<AuthorizationRow[]>;
  getGrantedAuthorizationsForOwnedAlbum: (args: {
    albumId: EntityId;
    ownerId: EntityId;
  }) => Promise<AuthorizationRow[]>;
};

type AuthorizationReadRepositoryDeps = { database: Knex };

const shareSelectColumns = [
  'access_grant.id',
  'access_grant.granted_to_user',
  'access_grant.permission',
  'access_grant.description',
  'access_grant.expires_at',
  'access_grant.revoked_at',
  'access_grant.created_at',
];

export const buildAuthorizationReadRepository = ({
  database,
}: AuthorizationReadRepositoryDeps): AuthorizationReadRepository => ({
  getGrantedAuthorizationsForOwnedMediaItem: async ({
    mediaItemId,
    ownerId,
  }: {
    mediaItemId: EntityId;
    ownerId: EntityId;
  }): Promise<AuthorizationRow[]> => {
    return withEnumRevival(
      database<AuthorizationRow>('accessGrant')
        .innerJoin('mediaItem', 'mediaItem.id', 'accessGrant.mediaItemId')
        .where('accessGrant.mediaItemId', mediaItemId)
        .andWhere('mediaItem.ownerId', ownerId)
        .orderBy('accessGrant.createdAt', 'asc')
        .select<AuthorizationRow[]>(...shareSelectColumns),
      { permission: SharePermission },
      { strict: true },
    );
  },
  getGrantedAuthorizationsForOwnedAlbum: async ({
    albumId,
    ownerId,
  }: {
    albumId: EntityId;
    ownerId: EntityId;
  }): Promise<AuthorizationRow[]> => {
    return withEnumRevival(
      database<AuthorizationRow>('accessGrant')
        .innerJoin('albumMember', 'albumMember.albumId', 'accessGrant.albumId')
        .where('accessGrant.albumId', albumId)
        .andWhere('albumMember.userId', ownerId)
        .andWhere('albumMember.role', 'owner')
        .orderBy('accessGrant.createdAt', 'asc')
        .select<AuthorizationRow[]>(...shareSelectColumns),
      { permission: SharePermission },
      { strict: true },
    );
  },
});
