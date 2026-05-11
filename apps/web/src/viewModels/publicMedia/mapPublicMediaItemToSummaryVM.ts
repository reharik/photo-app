import { PublicMediaItemSummaryFragment } from '../../graphql/generated/types';
import { PublicMediaItemSummaryVM } from './PublicMediaItemSummaryVM';

export function mapPublicMediaItemToSummaryVM(
  mediaItem: PublicMediaItemSummaryFragment,
): PublicMediaItemSummaryVM {
  return {
    id: mediaItem.id,
    kind: mediaItem.kind,
    mimeType: mediaItem.mimeType,
    title: mediaItem.title ?? '',
    width: mediaItem.width,
    height: mediaItem.height,
    durationSeconds: mediaItem.durationSeconds,
    viewerOperations: mediaItem.viewerOperations ?? [],
  };
}

export function mapMultiplePublicMediaItemsToSummaryVMs(
  mediaItems: PublicMediaItemSummaryFragment[],
): PublicMediaItemSummaryVM[] {
  return mediaItems.map(mapPublicMediaItemToSummaryVM);
}
