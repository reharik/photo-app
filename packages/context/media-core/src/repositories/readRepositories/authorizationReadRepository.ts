import { Operation, SharePermission } from '@packages/contracts';
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

type MediaItemOperations = {
  mediaItemId: EntityId;
  operations: Operation[];
};

type MediaItemOperationsRow = {
  mediaItemId: EntityId;
  operations: string;
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
  getMediaItemOperationsFromGrants(
    viewerId: EntityId,
    mediaItemIds: EntityId[],
  ): Promise<MediaItemOperations[]>;
  getPublicMediaItemOperationsFromGrants: (
    publicLinkId: EntityId,
    mediaItemIds: EntityId[],
  ) => Promise<MediaItemOperations[]>;
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

export const build__AuthorizationReadRepository = ({
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

  getMediaItemOperationsFromGrants: async (
    viewerId: EntityId,
    mediaItemIds: EntityId[],
  ): Promise<MediaItemOperations[]> => {
    if (mediaItemIds.length === 0) {
      return [];
    }
    return (
      (await database<MediaItemOperationsRow>('grant as g')
        .join('access_grant as ag', 'g.access_grant_id', 'ag.id')
        .whereIn('g.media_item_id', mediaItemIds)
        .where('g.granted_to_user', viewerId)
        .whereNull('ag.revoked_at')
        .where((expiry) => {
          expiry.whereNull('ag.expires_at').orWhere('ag.expires_at', '>', database.fn.now());
        })
        .select<MediaItemOperationsRow[]>(
          'g.media_item_id as mediaItemId',
          'g.permissions as operations',
        )) || []
    ).map((x) => ({
      mediaItemId: x.mediaItemId,
      operations: x.operations ? x.operations.split(',').map((p) => Operation.fromValue(p)) : [],
    }));
  },
  getPublicMediaItemOperationsFromGrants: async (
    publicLinkId: EntityId,
    mediaItemIds: EntityId[],
  ): Promise<MediaItemOperations[]> => {
    if (mediaItemIds.length === 0) {
      return [];
    }
    return (
      (await database<MediaItemOperationsRow>('grant as g')
        .join('access_grant as ag', 'g.access_grant_id', 'ag.id')
        .whereIn('g.media_item_id', mediaItemIds)
        .where('ag.share_link_id', publicLinkId)
        .whereNull('ag.revoked_at')
        .where((expiry) => {
          expiry.whereNull('ag.expires_at').orWhere('ag.expires_at', '>', database.fn.now());
        })
        .select<MediaItemOperationsRow[]>(
          'g.media_item_id as mediaItemId',
          'g.permissions as operations',
        )) || []
    ).map((x) => ({
      mediaItemId: x.mediaItemId,
      operations: x.operations ? x.operations.split(',').map((p) => Operation.fromValue(p)) : [],
    }));
  },
});
