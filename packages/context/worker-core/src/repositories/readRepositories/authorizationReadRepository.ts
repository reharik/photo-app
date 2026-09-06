import {
  AlbumMemberRole,
  AuthorizationKind,
  AuthorizationOrigin,
  EmailStatus,
  Operation,
  UserStatus,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UnitOfWork } from '../../infrastructure';
import type { EntityId } from '../../types/types';
import { withLiveAuthorizationFilter } from '../queryHelpers';
import type {
  AuthorizationReadRepository,
  AuthorizationRow,
  EmailShareRow,
  MediaItemOperations,
} from './types';

type AuthorizationReadRepositoryDeps = { uow: UnitOfWork };

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
  uow,
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
    await uow.join();
    return withEnumRevival(
      uow
        .db()('accessGrant')
        .innerJoin('albumItem', 'albumItem.albumId', 'accessGrant.albumId')
        .innerJoin('mediaItem', 'mediaItem.id', 'albumItem.mediaItemId')
        .where('albumItem.mediaItemId', mediaItemId)
        .andWhere('mediaItem.ownerId', ownerId)
        .modify(withLiveAuthorizationFilter(uow.db()))
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
    await uow.join();
    return withEnumRevival(
      uow
        .db()('accessGrant')
        .innerJoin('albumMember', 'albumMember.albumId', 'accessGrant.albumId')
        .where('accessGrant.albumId', albumId)
        .andWhere('albumMember.userId', ownerId)
        .andWhere('albumMember.role', 'owner')
        .modify(withLiveAuthorizationFilter(uow.db()))
        .orderBy('accessGrant.createdAt', 'asc')
        .select<AuthorizationRow[]>(...shareSelectColumns),
      { operations: Operation, kind: AuthorizationKind },
    );
  },

  getEmailedAuthorizationsForAlbum: async ({
    albumId,
    viewerId,
  }: {
    albumId: EntityId;
    viewerId: EntityId;
  }): Promise<EmailShareRow[]> => {
    await uow.join();
    /**
     * Latest delivery per grant, one row each — a resend supersedes. DISTINCT ON
     * needs its keys first in the ORDER BY, hence the raw; raw bypasses knex's
     * identifier wrapping, so everything inside is PHYSICAL snake_case. The
     * whereIn scopes the collapse to this album's grants: unscoped, Postgres
     * sorts all of email_delivery before the join instead of walking the
     * access_grant_id index.
     */
    const latestDeliveryPerGrant = uow
      .db()
      .from('emailDelivery')
      .whereIn(
        'emailDelivery.accessGrantId',
        uow.db().select('id').from('accessGrant').where('accessGrant.albumId', albumId),
      )
      .orderByRaw('access_grant_id, sent_at desc')
      .select(
        uow
          .db()
          .raw(
            'distinct on (access_grant_id) access_grant_id, status, coalesce(status_updated_at, sent_at) as delivery_at',
          ),
      )
      .as('latestDelivery');

    return withEnumRevival(
      uow
        .db()('accessGrant')
        .innerJoin('user', 'accessGrant.grantedToUser', 'user.id')
        .leftJoin(latestDeliveryPerGrant, 'latestDelivery.accessGrantId', 'accessGrant.id')
        .where('accessGrant.albumId', albumId)
        .whereIn('accessGrant.kind', [
          AuthorizationKind.pending.value,
          AuthorizationKind.user.value,
        ])
        .modify(withLiveAuthorizationFilter(uow.db()))
        .whereExists(
          uow
            .db()
            .select(uow.db().raw('1'))
            .from('albumMember')
            .where('albumMember.albumId', albumId)
            .where('albumMember.userId', viewerId)
            .whereIn('albumMember.role', rolesThatCan(Operation.grantAlbumAuthorization)),
        )
        .whereNotExists(
          uow
            .db()
            .select(uow.db().raw('1'))
            .from('albumMember as granteeMember')
            .where('granteeMember.albumId', uow.db().ref('accessGrant.albumId'))
            .where('granteeMember.userId', uow.db().ref('accessGrant.grantedToUser')),
        )
        .orderByRaw(`CASE WHEN "user"."user_status" = ? THEN 0 ELSE 1 END`, [
          UserStatus.active.value,
        ])
        .orderBy('accessGrant.createdAt', 'asc')
        .select<EmailShareRow[]>([
          'access_grant.id',
          'user.email',
          'user.firstName',
          'user.lastName',
          'user.id as userId',
          'user.userStatus',
          'access_grant.createdAt',
          'latestDelivery.status as deliveryStatus',
          'latestDelivery.deliveryAt as deliveryAt',
        ]),
      // deliveryStatus MUST be listed here: un-revived it is a bare string, and
      // `.state` on a string is undefined, so every row silently reports no
      // delivery — indistinguishable from an empty roster. Pinned by
      // apps/api/src/tests/shareRosterDeliveryStatus.integration.tests.ts,
      // which asserts on rows that HAVE a status (9 of its 10 cases fail if
      // this entry is dropped).
      { userStatus: UserStatus, deliveryStatus: EmailStatus },
    );
  },

  getMediaItemOperationsFromGrants: async (
    viewerId: EntityId,
    mediaItemIds: EntityId[],
  ): Promise<MediaItemOperations[]> => {
    if (mediaItemIds.length === 0) {
      return [];
    }
    await uow.join();
    return withEnumRevival(
      uow
        .db()('grant as g')
        .join('access_grant as ag', 'g.access_grant_id', 'ag.id')
        .whereIn('g.media_item_id', mediaItemIds)
        .modify(withLiveAuthorizationFilter(uow.db(), 'ag'))
        .where('g.granted_to_user', viewerId)
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
    await uow.join();
    return withEnumRevival(
      uow
        .db()('grant as g')
        .join('access_grant as ag', 'g.access_grant_id', 'ag.id')
        .whereIn('g.media_item_id', mediaItemIds)
        .where('ag.id', publicLinkId)
        .modify(withLiveAuthorizationFilter(uow.db(), 'ag'))
        .select<MediaItemOperations[]>(
          'g.media_item_id as mediaItemId',
          'g.operations as operations',
        ),
      { operations: Operation },
    );
  },
  getPublicAuthorizationByAlbum: async ({
    albumId,
    viewerId,
  }: {
    albumId: EntityId;
    viewerId: EntityId;
  }): Promise<AuthorizationRow> => {
    await uow.join();
    return withEnumRevival(
      uow
        .db()('accessGrant')
        .where('accessGrant.albumId', albumId)
        .where('accessGrant.kind', AuthorizationKind.public.value)
        .where('accessGrant.origin', AuthorizationOrigin.owner.value)
        .modify(withLiveAuthorizationFilter(uow.db()))
        .whereExists(
          uow
            .db()
            .select(uow.db().raw('1'))
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
