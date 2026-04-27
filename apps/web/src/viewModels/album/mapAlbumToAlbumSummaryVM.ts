import { AlbumSummaryFragment } from '../../graphql/generated/types';
import { mapMediaItemToMediaItemSummaryVM } from '../media/mapMediaItemToMediaItemSummaryVM';
import { AlbumSummaryVM } from './AlbumSummaryVM';

export function mapAlbumToAlbumSummaryVM(
  album: Omit<AlbumSummaryFragment, 'items'> & { items?: AlbumSummaryFragment['items'] },
): AlbumSummaryVM {
  return {
    id: album.id,
    title: album.title,
    viewerIsOwner: album.viewerIsOwner,
    coverMedia: album.coverMedia ? mapMediaItemToMediaItemSummaryVM(album.coverMedia) : undefined,
    itemCount: album.items?.nodes?.length ?? 0,
    updatedAt: album.updatedAt,
  };
}

export function mapMultipleAlbumsToAlbumSummaryVMs(
  albums: (Omit<AlbumSummaryFragment, 'items'> & { items?: AlbumSummaryFragment['items'] })[],
): AlbumSummaryVM[] {
  return albums.map(mapAlbumToAlbumSummaryVM);
}
