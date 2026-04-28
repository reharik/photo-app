import { AlbumSummaryFragment } from '../../graphql/generated/types';
import { mapMediaItemToSummaryVM } from '../media/mapMediaItemToSummaryVM';
import { AlbumSummaryVM } from './AlbumSummaryVM';

export function mapAlbumToSummaryVM(
  album: Omit<AlbumSummaryFragment, 'items'> & { items?: AlbumSummaryFragment['items'] },
): AlbumSummaryVM {
  return {
    id: album.id,
    title: album.title,
    viewerIsOwner: album.viewerIsOwner,
    coverMedia: album.coverMedia ? mapMediaItemToSummaryVM(album.coverMedia) : undefined,
    itemCount: album.items?.nodes?.length ?? 0,
    updatedAt: album.updatedAt,
  };
}

export function mapMultipleAlbumsToAlbumSummaryVMs(
  albums: (Omit<AlbumSummaryFragment, 'items'> & { items?: AlbumSummaryFragment['items'] })[],
): AlbumSummaryVM[] {
  return albums.map(mapAlbumToSummaryVM);
}
