import { MediaKind, ViewerOperation } from '@packages/contracts';
import { PublicMediaItemSummaryFragment } from '../../graphql/generated/types';
import { PublicMediaItemSummaryVM } from './PublicMediaItemSummaryVM';

export function mapPublicMediaItemToSummaryVM(
  mediaItem: PublicMediaItemSummaryFragment,
): PublicMediaItemSummaryVM {
  return {
    id: mediaItem.id,
    kind: MediaKind.fromValue(mediaItem.kind),
    mimeType: mediaItem.mimeType,
    title: mediaItem.title ?? '',
    viewerOperations: mediaItem.viewerOperations?.map((o) => ViewerOperation.fromValue(o)) ?? [],
  };
}

export function mapMultiplePublicMediaItemsToSummaryVMs(
  mediaItems: PublicMediaItemSummaryFragment[],
): PublicMediaItemSummaryVM[] {
  return mediaItems.map(mapPublicMediaItemToSummaryVM);
}
