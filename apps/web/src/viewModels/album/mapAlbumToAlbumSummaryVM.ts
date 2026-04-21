import { AlbumSummaryFragment } from '../../graphql/generated/types';
import { mapMediaItemToMediaItemSummaryVM } from '../media/mapMediaItemToMediaItemSummaryVM';
import { AlbumSummaryVM } from './AlbumSummaryVM';

export function mapAlbumToAlbumSummaryVM(album: AlbumSummaryFragment): AlbumSummaryVM {
  return {
    id: album.id,
    title: album.title,
    coverMedia: album.coverMedia ? mapMediaItemToMediaItemSummaryVM(album.coverMedia) : undefined,
    itemCount: album.items.nodes.length,
    updatedAt: album.updatedAt,
  };
}

export function mapMultipleAlbumsToAlbumSummaryVMs(
  albums: AlbumSummaryFragment[],
): AlbumSummaryVM[] {
  return albums.map(mapAlbumToAlbumSummaryVM);
}
