import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { PublicMediaItemReadRepository } from '../../../repositories/readRepositories/publicMediaItemReadRepository';
import { EntityId } from '../../../types/types';
import { PublicReadServiceFactoryBase } from '../readServiceBaseType';
import { PublicMediaItemProjection, PublicMediaItemRow } from '../types';

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
  mediaItemReadRepository: MediaItemReadRepository;
};

export const build__PublicMediaItemReadServiceFactory = ({
  publicMediaItemReadRepository,
  mediaItemReadRepository,
}: PublicMediaItemReadServiceFactoryDeps): PublicMediaItemReadServiceFactory => {
  return ({ publicLinkId }: { publicLinkId: string }) => {
    const withTags = async (row: PublicMediaItemRow): Promise<PublicMediaItemProjection> => {
      const tagMap = await mediaItemReadRepository.listTagsForMediaItemIds({
        mediaItemIds: [row.id],
      });
      return { ...row, tags: tagMap.get(row.id) ?? [] };
    };

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
        const projection = await withTags(row);
        return projection;
      },
    };
  };
};
