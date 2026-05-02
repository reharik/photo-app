import { MediaKind, ViewerOperation } from '@packages/contracts';
import { MediaItemSummaryFragment } from '../../graphql/generated/types';
import { MediaItemSummaryVM } from './MediaItemSummaryVM';

export function mapMediaItemToSummaryVM(mediaItem: MediaItemSummaryFragment): MediaItemSummaryVM {
  return {
    id: mediaItem.id,
    kind: MediaKind.fromValue(mediaItem.kind),
    title: mediaItem.title ?? mediaItem.originalFileName ?? '',
    createdAt: mediaItem.createdAt,
    viewerOperations: mediaItem.viewerOperations?.map((o) => ViewerOperation.fromValue(o)) ?? [],
    viewerIsOwner: mediaItem.viewerIsOwner,
  };
}

export function mapMultipleMediaItemsToSummaryVMs(
  mediaItems: MediaItemSummaryFragment[],
): MediaItemSummaryVM[] {
  return mediaItems.map(mapMediaItemToSummaryVM);
}
