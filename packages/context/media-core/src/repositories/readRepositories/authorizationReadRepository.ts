import { Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type { EntityId } from '../../types/types';
import type { AuthorizationReadRepository, AuthorizationRow, MediaItemOperations } from './types';

type AuthorizationReadRepositoryDeps = { database: Knex };

const shareSelectColumns = [
  'access_grant.id',
  'access_grant.granted_to_user',
  'access_grant.operations',
  'access_grant.label as description',
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
      database('accessGrant')
        .innerJoin('mediaItem', 'mediaItem.id', 'accessGrant.mediaItemId')
        .where('accessGrant.mediaItemId', mediaItemId)
        .andWhere('mediaItem.ownerId', ownerId)
        .orderBy('accessGrant.createdAt', 'asc')
        .select<AuthorizationRow[]>(...shareSelectColumns),
      { operation: Operation },
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
      database('accessGrant')
        .innerJoin('albumMember', 'albumMember.albumId', 'accessGrant.albumId')
        .where('accessGrant.albumId', albumId)
        .andWhere('albumMember.userId', ownerId)
        .andWhere('albumMember.role', 'owner')
        .orderBy('accessGrant.createdAt', 'asc')
        .select<AuthorizationRow[]>(...shareSelectColumns),
      { operation: Operation },
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
    return withEnumRevival(
      database('grant as g')
        .join('access_grant as ag', 'g.access_grant_id', 'ag.id')
        .whereIn('g.media_item_id', mediaItemIds)
        .where('g.granted_to_user', viewerId)
        .whereNull('ag.revoked_at')
        .where((expiry) => {
          expiry.whereNull('ag.expires_at').orWhere('ag.expires_at', '>', database.fn.now());
        })
        .select<MediaItemOperations[]>(
          'g.media_item_id as mediaItemId',
          'g.operations as operations',
        ),
      { operation: Operation },
      { strict: true },
    );
  },
  getPublicMediaItemOperationsFromGrants: async (
    publicLinkId: EntityId,
    mediaItemIds: EntityId[],
  ): Promise<MediaItemOperations[]> => {
    if (mediaItemIds.length === 0) {
      return [];
    }
    return withEnumRevival(
      database('grant as g')
        .join('access_grant as ag', 'g.access_grant_id', 'ag.id')
        .whereIn('g.media_item_id', mediaItemIds)
        .where('ag.share_link_id', publicLinkId)
        .whereNull('ag.revoked_at')
        .where((expiry) => {
          expiry.whereNull('ag.expires_at').orWhere('ag.expires_at', '>', database.fn.now());
        })
        .select<MediaItemOperations[]>(
          'g.media_item_id as mediaItemId',
          'g.operations as operations',
        ),
      { operation: Operation },
      { strict: true },
    );
  },
});
