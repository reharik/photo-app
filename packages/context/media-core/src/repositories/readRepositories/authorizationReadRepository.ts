import {
  AlbumMemberRole,
  AuthorizationKind,
  AuthorizationOrigin,
  Operation,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type { EntityId } from '../../types/types';
import type {
  AuthorizationReadRepository,
  AuthorizationRow,
  EmailShare,
  MediaItemOperations,
} from './types';

type AuthorizationReadRepositoryDeps = { database: Knex };

const shareSelectColumns = [
  'access_grant.id',
  'access_grant.granted_to_user',
  'access_grant.kind',
  'access_grant.origin',
  'access_grant.operations',
  'access_grant.label as description',
  'access_grant.link_token',
  'access_grant.expires_at',
  'access_grant.revoked_at',
  'access_grant.created_at',
];

const rolesThatCan = (op: Operation) =>
  AlbumMemberRole.items()
    .filter((r) => r.can(op))
    .map((r) => r.value);

export const build__AuthorizationReadRepository = ({
  database,
}: AuthorizationReadRepositoryDeps): AuthorizationReadRepository => ({
  /**
   * "Who have I shared this photo with?"
   *
   * Grants are album-scoped only — sharing loose items wraps them in a shadow album
   * first (see grantUserAuthorization), so there is no access_grant.media_item_id to
   * filter on any more. Reach the grants through every album that carries the item,
   * shadow or real; DISTINCT because one grant can be reached via several albumItem
   * rows. Ownership is still enforced on the media item itself.
   */
  getGrantedAuthorizationsForOwnedMediaItem: async ({
    mediaItemId,
    ownerId,
  }: {
    mediaItemId: EntityId;
    ownerId: EntityId;
  }): Promise<AuthorizationRow[]> => {
    return withEnumRevival(
      database('accessGrant')
        .innerJoin('albumItem', 'albumItem.albumId', 'accessGrant.albumId')
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where('albumItem.mediaItemId', mediaItemId)
        .andWhere('mediaItem.ownerId', ownerId)
        .orderBy('accessGrant.createdAt', 'asc')
        .distinct<AuthorizationRow[]>(...shareSelectColumns),
      { operations: Operation, kind: AuthorizationKind },
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
      { operations: Operation, kind: AuthorizationKind },
    );
  },

  getPendingEmailAuthorizationsForAlbum: async ({
    albumId,
    viewerId,
  }: {
    albumId: EntityId;
    viewerId: EntityId;
  }): Promise<EmailShare[]> => {
    return database('accessGrant')
      .innerJoin('user', 'accessGrant.grantedToUser', 'user.id')
      .where('accessGrant.albumId', albumId)
      .where('accessGrant.kind', AuthorizationKind.pending.value)
      .whereNull('accessGrant.revokedAt')
      .whereExists(
        database
          .select(database.raw('1'))
          .from('albumMember')
          .where('albumMember.albumId', albumId)
          .where('albumMember.userId', viewerId)
          .whereIn('albumMember.role', rolesThatCan(Operation.grantAlbumAuthorization)),
      )
      .orderBy('accessGrant.createdAt', 'asc')
      .select<EmailShare[]>([
        'access_grant.id',
        'user.email',
        'access_grant.createdAt as grantedAt',
      ]);
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
      { operations: Operation },
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
        .where('ag.id', publicLinkId)
        .whereNull('ag.revoked_at')
        .where((expiry) => {
          expiry.whereNull('ag.expires_at').orWhere('ag.expires_at', '>', database.fn.now());
        })
        .select<MediaItemOperations[]>(
          'g.media_item_id as mediaItemId',
          'g.operations as operations',
        ),
      { operations: Operation },
    );
  },
  getPublicAuthorizationByAlbum: ({
    albumId,
    viewerId,
  }: {
    albumId: EntityId;
    viewerId: EntityId;
  }): Promise<AuthorizationRow> => {
    return withEnumRevival(
      database('accessGrant')
        .where('accessGrant.albumId', albumId)
        .where('accessGrant.kind', AuthorizationKind.public.value)
        .where('accessGrant.origin', AuthorizationOrigin.owner.value)
        .whereNull('accessGrant.revokedAt')
        .whereExists(
          database
            .select(database.raw('1'))
            .from('albumMember')
            .where('albumMember.albumId', albumId)
            .where('albumMember.userId', viewerId)
            .whereIn('albumMember.role', rolesThatCan(Operation.grantAlbumAuthorization)),
        )
        .first<AuthorizationRow>(...shareSelectColumns),
      { operations: Operation, kind: AuthorizationKind, origin: AuthorizationOrigin },
    );
  },
});
