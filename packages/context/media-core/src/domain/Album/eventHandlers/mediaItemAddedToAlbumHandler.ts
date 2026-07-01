import { EntityType, UnseenActivityType } from '@packages/contracts';
import { SystemAuthorizationRepository } from '../../../repositories/systemRepositories/systemAuthorizationRepository';
import { SystemUnseenActivityRepository } from '../../../repositories/systemRepositories/systemUnseenActivityRepository';
import { EntityId } from '../../../types';
import { DomainEventHandler } from '../../domainEvents/eventPublisher';
import { MediaItemAddedToAlbum } from '../albumEvents';

export interface ActivityEvent {
  targetId: EntityId;
  albumId?: EntityId;
}

type MediaItemAddedToAlbumHandlerDeps = {
  systemUnseenActivityRepository: SystemUnseenActivityRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
};

export const build__MediaItemAddedToAlbumHandler = ({
  systemUnseenActivityRepository,
  systemAuthorizationRepository,
}: MediaItemAddedToAlbumHandlerDeps): DomainEventHandler<'mediaItemAddedToAlbum'> => ({
  handles: ['mediaItemAddedToAlbum'],
  processor: async (event: MediaItemAddedToAlbum) => {
    const authorizations = await systemAuthorizationRepository.getAuthorizationsByAlbumId([
      event.albumId,
    ]);

    const mutations = authorizations
      // authorization is not a public token auth
      //  and it is not pointed at the person who just added the image
      .filter((x) => x.grantedToUser && x.grantedToUser !== event.actorId)
      .map((x) =>
        systemUnseenActivityRepository.upsertActivityRow({
          id: crypto.randomUUID(),
          viewerId: x.grantedToUser,
          targetType: EntityType.album,
          targetId: event.albumId,
          albumId: event.albumId,
          activityKind: UnseenActivityType.itemAdded,
        }),
      );
    await Promise.all(mutations);
  },
});
