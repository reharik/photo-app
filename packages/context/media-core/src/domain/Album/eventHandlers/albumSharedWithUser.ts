import { EntityType, UnseenActivityType } from '@packages/contracts';
import { SystemUnseenActivityRepository } from '../../../repositories/systemRepositories/systemUnseenActivityRepository';
import { EntityId } from '../../../types';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { AlbumSharedWithUser } from '../albumEvents';

export interface ActivityEvent {
  targetId: EntityId;
  albumId?: EntityId;
}

type AlbumSharedWithUserHandlerDeps = {
  systemUnseenActivityRepository: SystemUnseenActivityRepository;
};

export const build__AlbumSharedWithUserHandler = ({
  systemUnseenActivityRepository,
}: AlbumSharedWithUserHandlerDeps): DomainEventHandler<'albumSharedWithUser'> => ({
  handles: ['albumSharedWithUser'],
  processor: async (event: AlbumSharedWithUser) => {
    await systemUnseenActivityRepository.upsertActivityRow({
      id: crypto.randomUUID(),
      viewerId: event.userId,
      targetType: EntityType.album,
      targetId: event.albumId,
      albumId: event.albumId,
      activityKind: UnseenActivityType.albumShared,
    });
  },
});
