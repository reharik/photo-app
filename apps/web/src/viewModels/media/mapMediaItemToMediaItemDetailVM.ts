import { MediaKind } from '@packages/contracts';
import { MediaItemDetailFragment } from '../../graphql/generated/types';
import { MediaItemDetailVM } from './MediaItemDetailVM';

export function mapMediaItemToMediaItemDetailVM(
  mediaItem: MediaItemDetailFragment,
): MediaItemDetailVM {
  return {
    id: mediaItem.id,
    kind: MediaKind.fromValue(mediaItem.kind),
    mimeType: mediaItem.mimeType,
    originalFileName: mediaItem.originalFileName,
    takenAt: mediaItem.takenAt ?? '',
    description: mediaItem.description,
    title: mediaItem.title ?? mediaItem.originalFileName ?? '',
    createdAt: mediaItem.createdAt,
  };
}

export function mapMultipleMediaItemsToMediaItemDetailVMs(
  mediaItems: MediaItemDetailFragment[],
): MediaItemDetailVM[] {
  return mediaItems.map(mapMediaItemToMediaItemDetailVM);
}
