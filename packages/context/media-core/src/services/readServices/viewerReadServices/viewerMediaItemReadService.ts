import { ReactionTargetType } from '@packages/contracts';
import { MediaStorage } from '../../../application/media/MediaStorage';
import { AuthorizationReadRepository } from '../../../repositories/readRepositories/authorizationReadRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { ReactionReadRepository } from '../../../repositories/readRepositories/reactionReadRepository';
import { EntityId } from '../../../types/types';
import { ReadReactionService } from '../readReactionService';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import {
  AuthorizationProjection,
  MediaItemCollectionInfo,
  MediaItemListProjection,
  MediaItemProjection,
  MediaItemRow,
} from '../types';

export interface ViewerMediaItemReadService {
  listMediaItems: (collectionInfo: MediaItemCollectionInfo) => Promise<MediaItemListProjection>;
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
};

export const build__ViewerMediaItemReadServiceFactory = ({
  mediaItemReadRepository,
  authorizationReadRepository,
  readReactionService,
}: ViewerMediaItemReadServiceFactoryDeps): ViewerMediaItemReadServiceFactory => {
  return ({ viewerId }: { viewerId: string }) => {
    const withTags = async (rows: MediaItemRow[]): Promise<MediaItemProjection[]> => {
      const ids = rows.map((r) => r.id);
      const tagMap = await mediaItemReadRepository.listTagsForMediaItemIds({
        mediaItemIds: ids,
      });
      return rows.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [] }));
    };

    return {
      listMediaItems: async (
        collectionInfo: MediaItemCollectionInfo,
      ): Promise<MediaItemListProjection> => {
        const dbMediaItems = await mediaItemReadRepository.listForViewer({
          viewerId,
          collectionInfo,
        });
        const mediaItems = await readReactionService.withViewerReactions(
          dbMediaItems,
          ReactionTargetType.mediaItem,
          viewerId,
        );
        const nodes = await withTags(mediaItems);
        return {
          nodes,
          pageInfo: collectionInfo.pageInfo,
        };
      },
      getMediaItemForViewer: async ({
        mediaItemId,
      }: {
        mediaItemId: EntityId;
      }): Promise<MediaItemProjection | undefined> => {
        const row = await mediaItemReadRepository.getForViewer({ mediaItemId, viewerId });
        if (!row) {
          return undefined;
        }
        const mediaItem = await readReactionService.withViewerReactions(
          [row],
          ReactionTargetType.mediaItem,
          viewerId,
        );

        const [projection] = await withTags(mediaItem);
        return projection;
      },
      listGrantedAuthorizationsForOwnedMediaItem: async (
        mediaItemId: EntityId,
      ): Promise<AuthorizationProjection[]> => {
        const rows = await authorizationReadRepository.getGrantedAuthorizationsForOwnedMediaItem({
          mediaItemId,
          ownerId: viewerId,
        });
        return rows.map((row) => ({
          id: row.id,
          grantedToUserId: row.grantedToUser,
          permission: row.permission,
          label: row.description,
          expiresAt: row.expiresAt,
          revokedAt: row.revokedAt,
          createdAt: row.createdAt,
        }));
      },
    };
  };
};
