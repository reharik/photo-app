import { DomainEventHandler } from '../../../domainEvents/eventPublisher';
import { SystemAlbumItemRepository } from '../../../repositories/systemRepositories/systemAlbumItemRepository';
import {
  isAuthorizationKind,
  SystemAuthorizationRepository,
} from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import {
  SystemGrantRepository,
  UpsertGrantInput,
} from '../../../repositories/systemRepositories/systemGrantRepository';
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
  | 'albumSharedWithPendingUser'
  | 'mediaItemAddedToAlbum'
  | 'mediaItemRemovedFromAlbum'
  | 'pendingUserActivated'
> => ({
  name: 'AuthorizationReconciliation',
  // MATERIALIZATION ONLY — every kind below belongs to a LIVE authorization and grows or
  // re-syncs its `grant` rows. The revoke/expire kinds are deliberately NOT handled here:
  // losing a teardown on the best-effort post-commit bus is a security failure and is not
  // self-healing (this handler only ever visits authorizations that are still active, so
  // nothing revisits a revoked one). Teardown belongs in the revoking service's
  // transaction — see the note on Album.revokeAuthorization.
  handles: [
    'albumSharedWithPublicLink',
    'albumSharedWithUser',
    'albumSharedWithPendingUser',
    'mediaItemAddedToAlbum',
    'mediaItemRemovedFromAlbum',
    'pendingUserActivated',
  ],
  processor: async (event) => {
    const resolved = await resolveAuthorizations(event);
    const pruningPromises = [];
    const grants: UpsertGrantInput[] = [];
    for (const { authorization, mediaItemIds } of resolved.authorizationMap.values()) {
      // Only a USER authorization names its grantee on the materialized grant. PENDING rows
      // also carry grantedToUser (a shadow user), so the old nullness predicate only got
      // this right via its second clause (linkToken == null) — the kind says it outright.
      const isUserAuth = isAuthorizationKind(authorization, 'USER');
      pruningPromises.push(
        systemGrantRepository.pruneGrantsForAuthorization(authorization.id, mediaItemIds),
      );
      // PublicLink/PendingUser Authentications don't add a token to the grant, it does
      // a look up of the Authentication that has the token on it. UserAuthentications are
      // more
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
