import { assertNever } from '@packages/contracts';
import { groupByMapping, indexByUnique } from '@packages/infrastructure';
import {
  isAuthorizationKind,
  PendingUserAuthorizationRow,
  PublicLinkAuthorizationRow,
  SystemAuthorizationRepository,
  SystemUserRepository,
  UserAuthorizationRow,
} from '../repositories';
import { SystemAlbumItemRepository } from '../repositories/systemRepositories/systemAlbumItemRepository';
import { EntityId } from '../types';
import { DomainEvent } from './DomainEvent';

/**
 * MATERIALIZATION ONLY. Every kind here grows or re-syncs the `grant` projection for a
 * LIVE authorization. Teardown (revoke/expire) is deliberately absent — see the note on
 * Album.revokeAuthorization: a lost teardown is a security failure and must not ride the
 * best-effort post-commit bus, so it belongs in the calling service's transaction.
 */
export type AuthorizationEvent = Extract<
  DomainEvent,
  {
    kind:
      | 'albumSharedWithPendingUser'
      | 'albumSharedWithPublicLink'
      | 'albumSharedWithUser'
      | 'mediaItemAddedToAlbum'
      | 'mediaItemRemovedFromAlbum'
      | 'pendingUserActivated';
  }
>;

type AuthorizationEntry = {
  authorization: PublicLinkAuthorizationRow | UserAuthorizationRow | PendingUserAuthorizationRow;
  mediaItemIds: EntityId[];
};
type AuthorizationMap = Map<string, AuthorizationEntry>;

export type ResolvedAuthorizations = { authorizationMap: AuthorizationMap };

export interface ResolveAuthorizations {
  (event: AuthorizationEvent): Promise<ResolvedAuthorizations>;
}

type ResolveAuthorizationsDeps = {
  systemAlbumItemRepository: SystemAlbumItemRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  systemUserRepository: SystemUserRepository;
};
const empty = (): ResolvedAuthorizations => ({ authorizationMap: new Map() });

export const build__ResolveAuthorizations = ({
  systemAlbumItemRepository,
  systemAuthorizationRepository,
  systemUserRepository,
}: ResolveAuthorizationsDeps): ResolveAuthorizations => {
  const getMediaItemIds = (
    authorization: PublicLinkAuthorizationRow | UserAuthorizationRow | PendingUserAuthorizationRow,
    itemsByAlbum: Map<string, { mediaItemId: EntityId; mediaItemOwnerId: EntityId }[]>,
  ): EntityId[] => {
    const granteeIsOwner = (
      authorization:
        PublicLinkAuthorizationRow | UserAuthorizationRow | PendingUserAuthorizationRow,
      item: { mediaItemId: EntityId; mediaItemOwnerId: EntityId },
    ) => {
      return isAuthorizationKind(authorization, 'USER')
        ? authorization.grantedToUser === item.mediaItemOwnerId
        : false;
    };
    return (
      itemsByAlbum
        .get(authorization.albumId)
        ?.filter((x) => !granteeIsOwner(authorization, x))
        .map((x) => x.mediaItemId) ?? []
    );
  };

  const buildMap = (
    authorizations: (
      PublicLinkAuthorizationRow | UserAuthorizationRow | PendingUserAuthorizationRow
    )[],
    itemsByAlbum: Map<string, { mediaItemId: EntityId; mediaItemOwnerId: EntityId }[]>,
  ): AuthorizationMap => {
    return new Map(
      authorizations.map((authorization) => [
        authorization.id,
        {
          authorization,
          mediaItemIds: getMediaItemIds(authorization, itemsByAlbum),
        },
      ]),
    );
  };
  const isActive = async (userId: EntityId): Promise<boolean> =>
    (await systemUserRepository.getActiveUsers([userId])).length > 0;

  return async (event: AuthorizationEvent): Promise<ResolvedAuthorizations> => {
    switch (event.kind) {
      case 'mediaItemRemovedFromAlbum':
      case 'mediaItemAddedToAlbum': {
        const { publicLinkAuthorizations, pendingUserAuthorizations, userAuthorizations } =
          await systemAuthorizationRepository.getAuthorizationsByAlbumId([event.albumId]);

        const activeUserMap = indexByUnique(
          await systemUserRepository.getActiveUsers(userAuthorizations.map((a) => a.grantedToUser)),
        );

        const activeUserAuths = userAuthorizations.filter((a) =>
          activeUserMap.has(a.grantedToUser),
        ); // multi-user filter
        const albumItems = await systemAlbumItemRepository.getItemsByAlbumIds([event.albumId]);
        const itemsByAlbum = groupByMapping(albumItems, (x) => x.albumId);
        // All three kinds materialize here. Pending authorizations deliberately SKIP the
        // active-user filter above: that filter drops USER rows whose grantee has no active
        // account, and a pending grantee never has one — running them through it would drop
        // every pending row. Omitting them entirely (what this did before 0024 made the kind
        // representable) means an invitee's grants stop growing the moment they are issued:
        // shared items land, later additions do not, until activation re-materializes.
        return {
          authorizationMap: buildMap(
            [...activeUserAuths, ...pendingUserAuthorizations, ...publicLinkAuthorizations],
            itemsByAlbum,
          ),
        };
      }

      case 'albumSharedWithPublicLink':
      case 'albumSharedWithPendingUser':
      case 'albumSharedWithUser': {
        const { userAuthorizations, pendingUserAuthorizations, publicLinkAuthorizations } =
          await systemAuthorizationRepository.getAuthorizationsByIds([event.authorizationId]);
        const authorizations = [
          ...userAuthorizations,
          ...pendingUserAuthorizations,
          ...publicLinkAuthorizations,
        ];

        const itemsByAlbum = groupByMapping(
          await systemAlbumItemRepository.getItemsByAlbumIds([event.albumId]),
          (x) => x.albumId,
        );
        return { authorizationMap: buildMap(authorizations, itemsByAlbum) };
      }

      case 'pendingUserActivated': {
        if (!(await isActive(event.userId))) {
          return empty();
        }
        const { userAuthorizations } = await systemAuthorizationRepository.getAuthorizationsByIds(
          event.authorizationIds,
        );
        const itemsByAlbum = groupByMapping(
          await systemAlbumItemRepository.getItemsByAlbumIds(
            userAuthorizations.map((a) => a.albumId),
          ),
          (x) => x.albumId,
        );
        return { authorizationMap: buildMap(userAuthorizations, itemsByAlbum) };
      }

      default: {
        return assertNever(event);
      }
    }
  };
};
