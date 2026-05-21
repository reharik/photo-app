import { ReactionTargetType } from '@packages/contracts';
import { groupByMapping } from '@packages/infrastructure';
import {
  MediaItemReadRepository,
  ReactionReadRepository,
} from '../../../repositories/readRepositories/types';
import { EntityId } from '../../../types';
import { MediaItemOperationsService } from '../MediaItemOperationsService';
import { ReadReactionService } from '../readReactionService';
import {
  DBMediaItemRow,
  DBPublicMediaItemRow,
  MediaItemProjection,
  PublicMediaItemProjection,
} from '../types';

export type EnrichMediaItems = {
  enrich: (viewerId: EntityId, rows: DBMediaItemRow[]) => Promise<MediaItemProjection[]>;
  enrichPublic: (
    publicLinkId: EntityId,
    rows: DBPublicMediaItemRow[],
  ) => Promise<PublicMediaItemProjection[]>;
};

export const build__EnrichMediaItems = ({
  mediaItemReadRepository,
  reactionReadRepository,
  readReactionService,
  mediaItemOperationsService,
}: {
  mediaItemReadRepository: MediaItemReadRepository;
  reactionReadRepository: ReactionReadRepository;
  readReactionService: ReadReactionService;
  mediaItemOperationsService: MediaItemOperationsService;
}): EnrichMediaItems => ({
  enrich: async (viewerId: EntityId, rows: DBMediaItemRow[]): Promise<MediaItemProjection[]> => {
    // Tags
    const tags = await mediaItemReadRepository.listTagsForMediaItemIds({
      mediaItemIds: rows.map((r) => r.id),
    });
    const tagMap = groupByMapping(
      tags,
      (t) => t.mediaItemId,
      (t) => t.label,
    );

    // Viewer Reactions
    const viewerReactionRows = await reactionReadRepository.viewerReactionsForTargets({
      viewerId,
      targetType: ReactionTargetType.mediaItem,
      targetIds: rows.map((r) => r.id),
    });
    const viewerReactionMap = groupByMapping(
      viewerReactionRows,
      (r) => r.targetId,
      (r) => ({ id: r.id, emoji: r.emoji }),
    );

    // Reaction Counts
    const reactionCounts = readReactionService.withReactions(rows);

    // Authorizations
    const itemAuthorizationMap = await mediaItemOperationsService.getOperationsByItem(
      viewerId,
      rows,
    );

    // Return the enriched media items
    return rows.map((r) => ({
      ...r,
      tags: tagMap.get(r.id) ?? [],
      reactionCounts: reactionCounts.get(r.id)?.reactionCounts ?? { total: 0, byEmoji: [] },
      viewerReactions: viewerReactionMap.get(r.id) ?? [],
      operations: itemAuthorizationMap.get(r.id) ?? [],
    }));
  },
  enrichPublic: async (
    publicLinkId: EntityId,
    rows: DBPublicMediaItemRow[],
  ): Promise<PublicMediaItemProjection[]> => {
    // Tags
    const tags = await mediaItemReadRepository.listTagsForMediaItemIds({
      mediaItemIds: rows.map((r) => r.id),
    });
    const tagMap = groupByMapping(
      tags,
      (t) => t.mediaItemId,
      (t) => t.label,
    );

    // Reaction Counts
    const reactionCounts = readReactionService.withReactions(rows);

    // Authorizations
    const itemAuthorizationMap = await mediaItemOperationsService.getOperationsByPublicItem(
      publicLinkId,
      rows,
    );

    // Return the enriched media items
    return rows.map((r) => ({
      ...r,
      tags: tagMap.get(r.id) ?? [],
      reactionCounts: reactionCounts.get(r.id)?.reactionCounts ?? { total: 0, byEmoji: [] },
      operations: itemAuthorizationMap.get(r.id) ?? [],
      viewerReactions: [],
    }));
  },
});
