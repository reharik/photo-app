import { EntityType, UnseenActivityType } from '@packages/contracts';
import { SystemUnseenActivityRepository } from '../../../repositories/systemRepositories/systemUnseenActivityRepository';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { AlbumSharedWithUser } from '../albumEvents';

type AlbumSharedWithUserHandlerDeps = {
  systemUnseenActivityRepository: SystemUnseenActivityRepository;
};

export const build__AlbumSharedWithUserHandler = ({
  systemUnseenActivityRepository,
}: AlbumSharedWithUserHandlerDeps): DomainEventHandler<'albumSharedWithUser'> => ({
  name: 'AlbumSharedWithUser',
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
