import { MediaItemDetailFragment } from '../../graphql/generated/types';
import { mapReactionCountsToVM } from '../reactions/mapReactionCountsToVM';
import { MediaItemDetailVM } from './MediaItemDetailVM';

export function mapMediaItemToMediaItemDetailVM(
  mediaItem: MediaItemDetailFragment,
): MediaItemDetailVM {
  return {
    id: mediaItem.id,
    kind: mediaItem.kind,
    mimeType: mediaItem.mimeType,
    originalFileName: mediaItem.originalFileName,
    takenAt: mediaItem.takenAt ?? '',
    description: mediaItem.description,
    title: mediaItem.title ?? mediaItem.originalFileName ?? '',
    createdAt: mediaItem.createdAt,
    viewerOperations: mediaItem.viewerOperations,
    viewerIsOwner: mediaItem.viewerIsOwner,
    reactionCounts: mapReactionCountsToVM(mediaItem.reactionCounts),
    viewerReactions: mediaItem.viewerReactions,
  };
}

export function mapMultipleMediaItemsToMediaItemDetailVMs(
  mediaItems: MediaItemDetailFragment[],
): MediaItemDetailVM[] {
  return mediaItems.map(mapMediaItemToMediaItemDetailVM);
}
