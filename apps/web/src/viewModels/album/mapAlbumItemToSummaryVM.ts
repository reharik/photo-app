import { AlbumItemSummaryFragment } from '../../graphql/generated/types';
import { mapMediaItemToSummaryVM } from '../media/mapMediaItemToSummaryVM';
import { AlbumItemSummaryVM } from './AlbumItemSummaryVM';

export function mapAlbumItemToSummaryVM(albumItem: AlbumItemSummaryFragment): AlbumItemSummaryVM {
  return {
    id: albumItem.id,
    createdAt: albumItem.createdAt,
    mediaItem: mapMediaItemToSummaryVM(albumItem.mediaItem),
    orderIndex: albumItem.orderIndex,
    updatedAt: albumItem.updatedAt,
    viewerOperations: albumItem.viewerOperations,
    viewerIsOwner: albumItem.viewerIsOwner,
  };
}

export function mapMultipleAlbumItemsToAlbumItemSummaryVMs(
  albumItems: AlbumItemSummaryFragment[],
): AlbumItemSummaryVM[] {
  return albumItems.map(mapAlbumItemToSummaryVM);
}
