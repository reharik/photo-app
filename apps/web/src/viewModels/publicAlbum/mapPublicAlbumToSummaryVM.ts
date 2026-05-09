import { PublicAlbumSummaryFragment } from '../../graphql/generated/types';
import { mapPublicMediaItemToSummaryVM } from '../publicMedia/mapPublicMediaItemToSummaryVM';
import { PublicAlbumSummaryVM } from './PublicAlbumSummaryVM';

export function mapPublicAlbumToSummaryVM(
  album: Omit<PublicAlbumSummaryFragment, 'items'> & {
    items?: PublicAlbumSummaryFragment['items'];
  },
): PublicAlbumSummaryVM {
  return {
    id: album.id,
    title: album.title,
    coverMedia: album.coverMedia ? mapPublicMediaItemToSummaryVM(album.coverMedia) : undefined,
    itemCount: album.items?.nodes?.length ?? 0,
  };
}

export function mapPublicMultipleAlbumsToAlbumSummaryVMs(
  albums: (Omit<PublicAlbumSummaryFragment, 'items'> & {
    items?: PublicAlbumSummaryFragment['items'];
  })[],
): PublicAlbumSummaryVM[] {
  return albums.map(mapPublicAlbumToSummaryVM);
}
