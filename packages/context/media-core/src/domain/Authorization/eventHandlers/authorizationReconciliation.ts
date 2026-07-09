import { SystemAlbumItemRepository } from '../../../repositories/systemRepositories/systemAlbumItemRepository';
import { SystemAuthorizationRepository } from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import {
  SystemGrantRepository,
  UpsertGrantInput,
} from '../../../repositories/systemRepositories/systemGrantRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
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
  | 'mediaItemAddedToAlbum'
  | 'albumSharedWithUser'
  | 'mediaItemsSharedWithUser'
  | 'mediaItemRemovedFromAlbum'
  | 'pendingUserActivated'
  | 'authorizationRevoked'
  | 'authorizationExpired'
> => ({
  name: 'AuthorizationReconciliation',
  handles: [
    'mediaItemAddedToAlbum',
    'albumSharedWithUser',
    'mediaItemsSharedWithUser',
    'mediaItemRemovedFromAlbum',
    'pendingUserActivated',
    'authorizationRevoked',
    'authorizationExpired',
  ],
  processor: async (event) => {
    const resolved = await resolveAuthorizations(event);
    const pruningPromises = [];
    const grants: UpsertGrantInput[] = [];
    for (const { authorization, mediaItemIds } of resolved.authorizationMap.values()) {
      pruningPromises.push(
        systemGrantRepository.pruneGrantsForAuthorization(authorization.id, mediaItemIds),
      );

      grants.push(
        ...mediaItemIds.map((mediaItemId) => ({
          accessGrantId: authorization.id,
          mediaItemId: mediaItemId,
          // this is guaranteed by the resolver
          grantedToUser: authorization.grantedToUser!,
          operations: authorization.operations.map((x) => x.value),
          createdBy: event.actorId,
          updatedBy: event.actorId,
        })),
      );
    }
    await Promise.all(pruningPromises);
    await systemGrantRepository.upsertGrants(grants);
  },
});
