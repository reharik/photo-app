import { PublicMediaItemReadRepository } from '../../../repositories/readRepositories/publicMediaItemReadRepository';
import { EntityId } from '../../../types/types';
import { PublicReadServiceFactoryBase } from '../readServiceBaseType';
import { PublicMediaItemProjection } from '../types';
import { EnrichMediaItems } from '../viewerReadServices/enrichMediaItems';

export interface PublicMediaItemReadService {
  getPublicMediaItem: (args: {
    mediaItemId: EntityId;
  }) => Promise<PublicMediaItemProjection | undefined>;
}

export interface PublicMediaItemReadServiceFactory extends PublicReadServiceFactoryBase {
  (args: { publicLinkId: string }): PublicMediaItemReadService;
}

type PublicMediaItemReadServiceFactoryDeps = {
  publicMediaItemReadRepository: PublicMediaItemReadRepository;
  enrichMediaItems: EnrichMediaItems;
};

export const build__PublicMediaItemReadServiceFactory = ({
  publicMediaItemReadRepository,
  enrichMediaItems,
}: PublicMediaItemReadServiceFactoryDeps): PublicMediaItemReadServiceFactory => {
  return ({ publicLinkId }: { publicLinkId: string }) => {
    return {
      getPublicMediaItem: async ({
        mediaItemId,
      }: {
        mediaItemId: EntityId;
      }): Promise<PublicMediaItemProjection | undefined> => {
        const row = await publicMediaItemReadRepository.getPublicMediaItem({
          mediaItemId,
          publicLinkId,
        });
        if (!row) {
          return undefined;
        }
        const projection = await enrichMediaItems.enrichPublic(publicLinkId, [row]);
        return projection[0];
      },
    };
  };
};
