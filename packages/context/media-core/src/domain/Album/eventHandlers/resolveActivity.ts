import { EntityType } from '@packages/contracts';
import { SystemAuthorizationRepository } from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import { EntityId } from '../../../types';
import { DomainEvent } from '../../domainEvents/DomainEvent';

export const assertNever = (x: never): never => {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`);
};

export type ActivityEvent = Extract<
  DomainEvent,
  {
    kind:
      | 'mediaItemAddedToAlbum'
      | 'albumSharedWithUser'
      | 'mediaItemsSharedWithUser'
      | 'albumSharedWithNonUser';
  }
>;

export type ResolvedActivity = {
  recipients: EntityId[];
  targetType: EntityType;
  targetId: EntityId;
  token?: string;
};

export type ResolveActivity = (event: ActivityEvent) => Promise<ResolvedActivity>;

type ResolveActivityDeps = { systemAuthorizationRepository: SystemAuthorizationRepository };

export const build__ResolveActivity =
  ({ systemAuthorizationRepository }: ResolveActivityDeps): ResolveActivity =>
  async (event) => {
    switch (event.kind) {
      case 'mediaItemAddedToAlbum': {
        const auths = await systemAuthorizationRepository.getAuthorizationsByAlbumId([
          event.albumId,
        ]);
        return {
          recipients: auths
            .filter((a) => a.grantedToUser && a.grantedToUser !== event.actorId)
            .map((a) => a.grantedToUser),
          targetType: EntityType.album,
          targetId: event.albumId,
        };
      }
      case 'albumSharedWithUser':
        return {
          recipients: [event.userId],
          targetType: EntityType.album,
          targetId: event.albumId,
        };
      case 'mediaItemsSharedWithUser':
        return {
          recipients: [event.userId],
          targetType: EntityType.mediaItem,
          targetId: event.mediaItemIds[0],
        };
      case 'albumSharedWithNonUser':
        return {
          recipients: [event.recipientAddress],
          targetType: EntityType.album,
          targetId: event.albumId,
          token: event.token,
        };
      default:
        return assertNever(event);
    }
  };
