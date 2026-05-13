import { MediaItemSummaryFragment } from '../../graphql/generated/types';
import { mapReactionCountsToVM } from '../reactions/mapReactionCountsToVM';
import { MediaItemSummaryVM } from './MediaItemSummaryVM';

export function mapMediaItemToSummaryVM(mediaItem: MediaItemSummaryFragment): MediaItemSummaryVM {
  return {
    id: mediaItem.id,
    kind: mediaItem.kind,
    status: mediaItem.status,
    title: mediaItem.title ?? mediaItem.originalFileName ?? '',
    createdAt: mediaItem.createdAt,
    viewerOperations: mediaItem.viewerOperations ?? [],
    viewerIsOwner: mediaItem.viewerIsOwner,
    reactionCounts: mapReactionCountsToVM(mediaItem.reactionCounts),
    viewerReactions: mediaItem.viewerReactions,
  };
}

export function mapMultipleMediaItemsToSummaryVMs(
  mediaItems: MediaItemSummaryFragment[],
): MediaItemSummaryVM[] {
  return mediaItems.map(mapMediaItemToSummaryVM);
}
