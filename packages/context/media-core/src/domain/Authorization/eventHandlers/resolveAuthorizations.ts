import { assertNever, match } from '@packages/contracts';
import { groupByMapping, indexByUnique } from '@packages/infrastructure';
import {
  PublicLinkAuthorizationRow,
  SystemAuthorizationRepository,
  SystemUserRepository,
  UserAuthorizationRow,
} from '../../../repositories';
import { SystemAlbumItemRepository } from '../../../repositories/systemRepositories/systemAlbumItemRepository';
import { EntityId } from '../../../types';
import { DomainEvent } from '../../domainEvents/DomainEvent';

export type AuthorizationEvent = Extract<
  DomainEvent,
  {
    kind:
      | 'albumSharedWithPublicLink'
      | 'albumSharedWithUser'
      | 'authorizationExpired'
      | 'authorizationRevoked'
      | 'mediaItemAddedToAlbum'
      | 'mediaItemRemovedFromAlbum'
      | 'mediaItemsSharedWithUser'
      | 'pendingUserActivated';
  }
>;

type AuthorizationEntry = {
  authorization: PublicLinkAuthorizationRow | UserAuthorizationRow;
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
    authorization: PublicLinkAuthorizationRow | UserAuthorizationRow,
    itemsByAlbum: Map<string, { mediaItemId: EntityId }[]>,
  ): EntityId[] => {
    return match(
      authorization.target,
      {
        album: (t, m) => m.get(t.albumId)?.map((x) => x.mediaItemId) ?? [],
        mediaItem: (t) => [t.mediaItemId],
      },
      itemsByAlbum,
    );
  };

  const buildMap = (
    authorizations: (PublicLinkAuthorizationRow | UserAuthorizationRow)[],
    itemsByAlbum: Map<string, { mediaItemId: EntityId }[]>,
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
        const { publicLinkAuthorizations, userAuthorizations } =
          await systemAuthorizationRepository.getAuthorizationsByAlbumId([event.albumId]);

        const activeUserMap = indexByUnique(
          await systemUserRepository.getActiveUsers(userAuthorizations.map((a) => a.grantedToUser)),
        );

        const activeUserAuths = userAuthorizations.filter((a) =>
          activeUserMap.has(a.grantedToUser),
        ); // multi-user filter
        const itemsByAlbum = groupByMapping(
          await systemAlbumItemRepository.getItemsByAlbumIds([event.albumId]),
          (x) => x.albumId,
        );
        return {
          authorizationMap: buildMap(
            [...activeUserAuths, ...publicLinkAuthorizations],
            itemsByAlbum,
          ),
        };
      }

      case 'albumSharedWithUser': {
        if (!(await isActive(event.userId))) {
          return empty();
        }
        const { userAuthorizations } = await systemAuthorizationRepository.getAuthorizationsByIds([
          event.authorizationId,
        ]);
        const itemsByAlbum = groupByMapping(
          await systemAlbumItemRepository.getItemsByAlbumIds([event.albumId]),
          (x) => x.albumId,
        );
        return { authorizationMap: buildMap(userAuthorizations, itemsByAlbum) };
      }

      case 'albumSharedWithPublicLink': {
        const { publicLinkAuthorizations } =
          await systemAuthorizationRepository.getAuthorizationsByIds([event.authorizationId]);
        const itemsByAlbum = groupByMapping(
          await systemAlbumItemRepository.getItemsByAlbumIds([event.albumId]),
          (x) => x.albumId,
        );
        return { authorizationMap: buildMap(publicLinkAuthorizations, itemsByAlbum) };
      }

      case 'mediaItemsSharedWithUser': {
        if (!(await isActive(event.userId))) {
          return empty();
        }
        const { userAuthorizations } = await systemAuthorizationRepository.getAuthorizationsByIds(
          event.authorizationIds,
        );
        return {
          authorizationMap: buildMap(userAuthorizations, new Map()),
        };
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
            userAuthorizations.flatMap((a) =>
              a.target.kind === 'album' ? [a.target.albumId] : [],
            ),
          ),
          (x) => x.albumId,
        );
        return { authorizationMap: buildMap(userAuthorizations, itemsByAlbum) };
      }

      case 'authorizationExpired':
      case 'authorizationRevoked': {
        const { userAuthorizations, publicLinkAuthorizations } =
          await systemAuthorizationRepository.getAuthorizationsByIds([event.authorizationId]);
        const all = [...userAuthorizations, ...publicLinkAuthorizations];
        return {
          authorizationMap: new Map(all.map((a) => [a.id, { authorization: a, mediaItemIds: [] }])),
        };
      }
      default: {
        return assertNever(event);
      }
    }
  };
};
