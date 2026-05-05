import { MediaItemSummaryFragment } from '../../graphql/generated/types';
import { MediaItemSummaryVM } from './MediaItemSummaryVM';

export function mapMediaItemToSummaryVM(mediaItem: MediaItemSummaryFragment): MediaItemSummaryVM {
  return {
    id: mediaItem.id,
    kind: mediaItem.kind,
    title: mediaItem.title ?? mediaItem.originalFileName ?? '',
    createdAt: mediaItem.createdAt,
    viewerOperations: mediaItem.viewerOperations ?? [],
    viewerIsOwner: mediaItem.viewerIsOwner,
  };
}

export function mapMultipleMediaItemsToSummaryVMs(
  mediaItems: MediaItemSummaryFragment[],
): MediaItemSummaryVM[] {
  return mediaItems.map(mapMediaItemToSummaryVM);
}
