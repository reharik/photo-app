import { MediaKind } from '@packages/contracts';
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
    thumbnailUrl: mediaItem.derivedUrls.thumbnail,
  };
}

export function mapMultipleMediaItemsToMediaItemSummaryVMs(
  mediaItems: MediaItemSummaryFragment[],
): MediaItemSummaryVM[] {
  return mediaItems.map(mapMediaItemToMediaItemSummaryVM);
}
