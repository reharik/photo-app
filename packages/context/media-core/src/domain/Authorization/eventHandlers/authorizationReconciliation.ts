import { SystemAlbumItemRepository } from '../../../repositories/systemRepositories/systemAlbumItemRepository';
import { SystemAuthorizationRepository } from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import {
  SystemGrantRepository,
  UpsertGrantInput,
} from '../../../repositories/systemRepositories/systemGrantRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { isUserAuthRecord } from '../UserAuthorization';
import { ResolveAuthorizations } from './resolveAuthorizations';

type AuthorizationReconciliationDeps = {
  systemAlbumItemRepository: SystemAlbumItemRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  systemGrantRepository: SystemGrantRepository;
  resolveAuthorizations: ResolveAuthorizations;
};

export const build__AuthorizationReconciliation = ({
  systemGrantRepository,
  resolveAuthorizations,
}: AuthorizationReconciliationDeps): DomainEventHandler<
  | 'albumSharedWithPublicLink'
  | 'albumSharedWithUser'
  | 'authorizationExpired'
  | 'authorizationRevoked'
  | 'mediaItemAddedToAlbum'
  | 'mediaItemRemovedFromAlbum'
  | 'mediaItemsSharedWithUser'
  | 'pendingUserActivated'
> => ({
  name: 'AuthorizationReconciliation',
  handles: [
    'albumSharedWithPublicLink',
    'albumSharedWithUser',
    'authorizationExpired',
    'authorizationRevoked',
    'mediaItemAddedToAlbum',
    'mediaItemRemovedFromAlbum',
    'mediaItemsSharedWithUser',
    'pendingUserActivated',
  ],
  processor: async (event) => {
    const resolved = await resolveAuthorizations(event);
    const pruningPromises = [];
    const grants: UpsertGrantInput[] = [];
    for (const { authorization, mediaItemIds } of resolved.authorizationMap.values()) {
      const isUserAuth = isUserAuthRecord(authorization);
      pruningPromises.push(
        systemGrantRepository.pruneGrantsForAuthorization(authorization.id, mediaItemIds),
      );

      grants.push(
        ...mediaItemIds.map((mediaItemId) => ({
          id: crypto.randomUUID(),
          accessGrantId: authorization.id,
          mediaItemId: mediaItemId,
          grantedToUser: isUserAuth ? authorization.grantedToUser : undefined,
          operations: authorization.operations.map((x) => x.value),
        })),
      );
    }
    await Promise.all(pruningPromises);
    await systemGrantRepository.upsertGrants(grants);
  },
});
