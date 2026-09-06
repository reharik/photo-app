import { PublicMediaItemReadRepository } from '../../../repositories/readRepositories/publicMediaItemReadRepository';
import { EntityId } from '../../../types/types';
import { PublicReadServiceBase } from '../readServiceBaseType';
import { PublicMediaItemProjection } from '../types';
import { EnrichMediaItems } from '../viewerReadServices/enrichMediaItems';

export interface PublicMediaItemReadService extends PublicReadServiceBase {
  getPublicMediaItem: (args: {
    mediaItemId: EntityId;
  }) => Promise<PublicMediaItemProjection | undefined>;
}

type PublicMediaItemReadServiceDeps = {
  publicMediaItemReadRepository: PublicMediaItemReadRepository;
  enrichMediaItems: EnrichMediaItems;
  publicLinkId: string;
};

export const build__PublicMediaItemReadService = ({
  publicMediaItemReadRepository,
  enrichMediaItems,
  publicLinkId,
}: PublicMediaItemReadServiceDeps): PublicMediaItemReadService => {
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
