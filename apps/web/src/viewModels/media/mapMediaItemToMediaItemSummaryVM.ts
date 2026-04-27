import { MediaKind, ViewerOperation } from '@packages/contracts';
import { MediaItemSummaryFragment } from '../../graphql/generated/types';
import { MediaItemSummaryVM } from './MediaItemSummaryVM';

export function mapMediaItemToMediaItemSummaryVM(
  mediaItem: MediaItemSummaryFragment,
): MediaItemSummaryVM {
  return {
    id: mediaItem.id,
    kind: MediaKind.fromValue(mediaItem.kind),
    title: mediaItem.title ?? mediaItem.originalFileName ?? '',
    createdAt: mediaItem.createdAt,
    viewerOperations: mediaItem.viewerOperations?.map((o) => ViewerOperation.fromValue(o)) ?? [],
  };
}

export function mapMultipleMediaItemsToMediaItemSummaryVMs(
  mediaItems: MediaItemSummaryFragment[],
): MediaItemSummaryVM[] {
  return mediaItems.map(mapMediaItemToMediaItemSummaryVM);
}
