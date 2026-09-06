import { MediaItemReadRepository } from '../../../repositories/readRepositories/types';
import { EntityId } from '../../../types/types';
import { ReadServiceBase } from '../readServiceBaseType';
import { MediaItemCollectionInfo, MediaItemProjection, PagedList } from '../types';
import { EnrichMediaItems } from './enrichMediaItems';

export interface ViewerMediaItemReadService extends ReadServiceBase {
  listMediaItems: (
    collectionInfo: MediaItemCollectionInfo,
  ) => Promise<PagedList<MediaItemProjection>>;
  getMediaItemForViewer: (args: {
    mediaItemId: EntityId;
  }) => Promise<MediaItemProjection | undefined>;
}

type ViewerMediaItemReadServiceDeps = {
  mediaItemReadRepository: MediaItemReadRepository;
  enrichMediaItems: EnrichMediaItems;
  viewerId: string;
};

export const build__ViewerMediaItemReadService = ({
  mediaItemReadRepository,
  enrichMediaItems,
  viewerId,
}: ViewerMediaItemReadServiceDeps): ViewerMediaItemReadService => {
  const listMediaItems = async (
    collectionInfo: MediaItemCollectionInfo,
  ): Promise<PagedList<MediaItemProjection>> => {
    const dbMediaItemsResult = await mediaItemReadRepository.listForViewer({
      viewerId,
      collectionInfo,
    });

    return {
      nodes: await enrichMediaItems.enrich(viewerId, dbMediaItemsResult.nodes),
      totalCount: dbMediaItemsResult.totalCount,
    };
  };
  const getMediaItemForViewer = async ({
    mediaItemId,
  }: {
    mediaItemId: EntityId;
  }): Promise<MediaItemProjection | undefined> => {
    const row = await mediaItemReadRepository.getForViewer({ mediaItemId, viewerId });
    if (!row) {
      return undefined;
    }
    const node = await enrichMediaItems.enrich(viewerId, [row]);

    return node[0];
  };
  return {
    listMediaItems,
    getMediaItemForViewer,
  };
};
