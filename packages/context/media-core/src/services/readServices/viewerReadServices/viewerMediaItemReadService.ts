import { ReactionTargetType } from '@packages/contracts';
import { MediaStorage } from '../../../application/media/MediaStorage';
import {
  AuthorizationReadRepository,
  MediaItemReadRepository,
  ReactionReadRepository,
} from '../../../repositories/readRepositories/types';
import { EntityId } from '../../../types/types';
import { ReadReactionService } from '../readReactionService';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import {
  AuthorizationProjection,
  MediaItemCollectionInfo,
  MediaItemProjection,
  PagedList,
} from '../types';
import { EnrichMediaItems } from './enrichMediaItems';

export interface ViewerMediaItemReadService {
  listMediaItems: (
    collectionInfo: MediaItemCollectionInfo,
  ) => Promise<PagedList<MediaItemProjection>>;
  getMediaItemForViewer: (args: {
    mediaItemId: EntityId;
  }) => Promise<MediaItemProjection | undefined>;
}

export interface ViewerMediaItemReadServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ViewerMediaItemReadService;
}

type ViewerMediaItemReadServiceFactoryDeps = {
  mediaItemReadRepository: MediaItemReadRepository;
  authorizationReadRepository: AuthorizationReadRepository;
  reactionReadRepository: ReactionReadRepository;
  mediaStorage: MediaStorage;
  readReactionService: ReadReactionService;
  reactionTargetType: ReactionTargetType;
  enrichMediaItems: EnrichMediaItems;
};

export const build__ViewerMediaItemReadServiceFactory = ({
  mediaItemReadRepository,
  authorizationReadRepository,
  enrichMediaItems,
}: ViewerMediaItemReadServiceFactoryDeps): ViewerMediaItemReadServiceFactory => {
  return ({ viewerId }: { viewerId: string }) => {
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
    const listGrantedAuthorizationsForOwnedMediaItem = async (
      mediaItemId: EntityId,
    ): Promise<AuthorizationProjection[]> => {
      const rows = await authorizationReadRepository.getGrantedAuthorizationsForOwnedMediaItem({
        mediaItemId,
        ownerId: viewerId,
      });
      return rows.map((row) => ({
        id: row.id,
        grantedToUserId: row.grantedToUser,
        operations: row.operations,
        label: row.description,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      }));
    };
    return {
      listMediaItems,
      getMediaItemForViewer,
      listGrantedAuthorizationsForOwnedMediaItem,
    };
  };
};
