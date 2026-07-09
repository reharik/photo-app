import { groupByMapping, indexByUnique } from '@packages/infrastructure';
import {
  AuthorizationRow,
  SystemAuthorizationRepository,
  SystemUserRepository,
} from '../../../repositories';
import { SystemAlbumItemRepository } from '../../../repositories/systemRepositories/systemAlbumItemRepository';
import { EntityId } from '../../../types';
import { DomainEvent } from '../../domainEvents/DomainEvent';

export const assertNever = (x: never): never => {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`);
};

export type AuthorizationEvent = Extract<
  DomainEvent,
  {
    kind:
      | 'mediaItemAddedToAlbum'
      | 'albumSharedWithUser'
      | 'mediaItemsSharedWithUser'
      | 'mediaItemRemovedFromAlbum'
      | 'pendingUserActivated'
      | 'authorizationRevoked'
      | 'authorizationExpired';
  }
>;

type AuthorizationEntry = { authorization: AuthorizationRow; mediaItemIds: EntityId[] };
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
  const buildMap = (
    authorizations: AuthorizationRow[],
    itemsByAlbum: Map<string, { mediaItemId: EntityId }[]>,
  ): AuthorizationMap =>
    new Map(
      authorizations
        .filter((a) => a.grantedToUser)
        .map((authorization) => [
          authorization.id,
          {
            authorization,
            mediaItemIds: itemsByAlbum.get(authorization.albumId)?.map((x) => x.mediaItemId) ?? [],
          },
        ]),
    );
  const isActive = async (userId: EntityId): Promise<boolean> =>
    (await systemUserRepository.getActiveUsers([userId])).length > 0;

  return async (event: AuthorizationEvent): Promise<ResolvedAuthorizations> => {
    switch (event.kind) {
      case 'mediaItemRemovedFromAlbum':
      case 'mediaItemAddedToAlbum': {
        const auths = await systemAuthorizationRepository.getAuthorizationsByAlbumId([
          event.albumId,
        ]);
        const activeUserMap = indexByUnique(
          await systemUserRepository.getActiveUsers(auths.map((a) => a.grantedToUser)),
        );
        const active = auths.filter((a) => activeUserMap.has(a.grantedToUser)); // multi-user filter
        const itemsByAlbum = groupByMapping(
          await systemAlbumItemRepository.getItemsByAlbumIds([event.albumId]),
          (x) => x.albumId,
        );
        return { authorizationMap: buildMap(active, itemsByAlbum) };
      }

      case 'albumSharedWithUser': {
        if (!(await isActive(event.userId))) {
          return empty();
        }
        const auths = await systemAuthorizationRepository.getAuthorizationsByIds([
          event.authorizationId,
        ]);
        const itemsByAlbum = groupByMapping(
          await systemAlbumItemRepository.getItemsByAlbumIds([event.albumId]),
          (x) => x.albumId,
        );
        return { authorizationMap: buildMap(auths, itemsByAlbum) };
      }

      case 'pendingUserActivated': {
        if (!(await isActive(event.userId))) {
          return empty();
        }
        const auths = await systemAuthorizationRepository.getAuthorizationsByIds(
          event.authorizationIds,
        );
        const itemsByAlbum = groupByMapping(
          await systemAlbumItemRepository.getItemsByAlbumIds(auths.map((a) => a.albumId)),
          (x) => x.albumId,
        );
        return { authorizationMap: buildMap(auths, itemsByAlbum) };
      }

      case 'mediaItemsSharedWithUser': {
        if (!(await isActive(event.userId))) {
          return empty();
        }
        const auths = await systemAuthorizationRepository.getAuthorizationsByIds(
          event.authorizationIds,
        );
        return {
          authorizationMap: new Map(
            auths.map((a) => [a.id, { authorization: a, mediaItemIds: event.mediaItemIds }]),
          ),
        };
      }

      case 'authorizationExpired':
      case 'authorizationRevoked': {
        const auths = await systemAuthorizationRepository.getAuthorizationsByIds([
          event.authorizationId,
        ]);
        return {
          authorizationMap: new Map(
            auths.map((a) => [a.id, { authorization: a, mediaItemIds: [] }]),
          ),
        };
      }
      default: {
        return assertNever(event);
      }
    }
  };
};

/*
definite trigger list:

albumShared (active or pending grantee)
mediaItemShared (active or pending grantee)
mediaItemAddedToAlbum
mediaItemRemovedFromAlbum
pendingUserActivated
authorizationRevoked


Conditional / needs-a-decision:
7. authorizationExpired — no natural event; sweep or lazy?
8. authorizationOperationsChanged — only if operations become editable
*/
