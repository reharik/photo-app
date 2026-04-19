import { AlbumItemSummaryFragment } from '../../graphql/generated/types';
import { mapMediaItemToMediaItemSummaryVM } from '../media/mapMediaItemToMediaItemSummaryVM';
import { AlbumItemSummaryVM } from './AlbumItemSummaryVM';

export function mapAlbumItemToAlbumItemSummaryVM(
  albumItem: AlbumItemSummaryFragment,
): AlbumItemSummaryVM {
  return {
    id: albumItem.id,
    createdAt: albumItem.createdAt,
    mediaItem: mapMediaItemToMediaItemSummaryVM(albumItem.mediaItem),
    orderIndex: albumItem.orderIndex,
    updatedAt: albumItem.updatedAt,
  };
}

export function mapMultipleAlbumItemsToAlbumItemSummaryVMs(
  albumItems: AlbumItemSummaryFragment[],
): AlbumItemSummaryVM[] {
  return albumItems.map(mapAlbumItemToAlbumItemSummaryVM);
}
