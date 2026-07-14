import { assertNever, EntityType } from '@packages/contracts';
import { SystemUserRepository, UserContact } from '../../../repositories';
import { SystemAuthorizationRepository } from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import { EntityId } from '../../../types';
import { DomainEvent } from '../../domainEvents/DomainEvent';

export type ActivityEvent = Extract<
  DomainEvent,
  {
    kind: 'mediaItemAddedToAlbum' | 'albumSharedWithUser' | 'mediaItemsSharedWithUser';
  }
>;

export type ResolvedActivity = {
  recipients: UserContact[];
  targetType: EntityType;
  targetId: EntityId;
  token?: string;
};

export type ResolveActivity = (event: ActivityEvent) => Promise<ResolvedActivity>;

type ResolveActivityDeps = {
  systemAuthorizationRepository: SystemAuthorizationRepository;
  systemUserRepository: SystemUserRepository;
};

export const build__ResolveActivity =
  ({ systemAuthorizationRepository, systemUserRepository }: ResolveActivityDeps): ResolveActivity =>
  async (event) => {
    let users: UserContact[];
    switch (event.kind) {
      case 'mediaItemAddedToAlbum': {
        const { userAuthorizations } =
          await systemAuthorizationRepository.getAuthorizationsByAlbumId([event.albumId]);
        const userIds = userAuthorizations
          .filter((a) => a.grantedToUser !== event.actorId)
          .map((x) => x.grantedToUser);
        users = await systemUserRepository.getUserContacts(userIds);
        return {
          recipients: users,
          targetType: EntityType.album,
          targetId: event.albumId,
        };
      }
      case 'albumSharedWithUser':
        users = await systemUserRepository.getUserContacts([event.userId]);

        return {
          recipients: users,
          targetType: EntityType.album,
          targetId: event.albumId,
        };
      case 'mediaItemsSharedWithUser':
        users = await systemUserRepository.getUserContacts([event.userId]);
        return {
          recipients: users,
          targetType: EntityType.mediaItem,
          targetId: event.mediaItemIds[0],
        };

      default:
        return assertNever(event);
    }
  };
