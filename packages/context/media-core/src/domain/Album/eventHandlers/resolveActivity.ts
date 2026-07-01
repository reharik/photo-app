import { EntityType } from '@packages/contracts';
import { SystemAuthorizationRepository } from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import { EntityId } from '../../../types';
import { DomainEvent } from '../../domainEvents/DomainEvent';

const assertNever = (x: never): never => {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`);
};

type ActivityEvent = Extract<
  DomainEvent,
  { kind: 'mediaItemAddedToAlbum' | 'albumSharedWithUser' }
>;

export type ResolvedActivity = {
  recipients: EntityId[];
  targetType: EntityType;
  targetId: EntityId;
  albumId: EntityId;
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
          albumId: event.albumId,
        };
      }
      case 'albumSharedWithUser':
        return {
          recipients: [event.userId],
          targetType: EntityType.album,
          targetId: event.albumId,
          albumId: event.albumId,
        };
      default:
        return assertNever(event);
    }
  };
