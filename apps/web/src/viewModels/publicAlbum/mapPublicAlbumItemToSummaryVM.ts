import { PublicAlbumItemSummaryFragment } from '../../graphql/generated/types';
import { mapPublicMediaItemToSummaryVM } from '../publicMedia/mapPublicMediaItemToSummaryVM';
import { PublicAlbumItemSummaryVM } from './PublicAlbumItemSummaryVM';

export function mapPublicAlbumItemToSummaryVM(
  albumItem: PublicAlbumItemSummaryFragment,
): PublicAlbumItemSummaryVM {
  return {
    id: albumItem.id,
    mediaItem: mapPublicMediaItemToSummaryVM(albumItem.mediaItem),
    orderIndex: albumItem.orderIndex,
    viewerOperations: albumItem.viewerOperations,
    viewerIsOwner: false,
  };
}

export function mapMultiplePublicAlbumItemsToSummaryVMs(
  albumItems: PublicAlbumItemSummaryFragment[],
): PublicAlbumItemSummaryVM[] {
  return albumItems.map(mapPublicAlbumItemToSummaryVM);
}
