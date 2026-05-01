import { AlbumMemberRole } from '@packages/contracts';
import { ViewerOperation } from 'node_modules/@packages/contracts/src/enums/viewerOperations';
import { AlbumSummaryFragment } from '../../graphql/generated/types';
import { mapMediaItemToSummaryVM } from '../media/mapMediaItemToSummaryVM';
import { AlbumSummaryVM } from './AlbumSummaryVM';

export function mapAlbumToSummaryVM(
  album: Omit<AlbumSummaryFragment, 'items'> & { items?: AlbumSummaryFragment['items'] },
): AlbumSummaryVM {
  console.log(`************album************`);
  console.log(JSON.stringify(album, null, 4));
  console.log(`********END album************`);
  return {
    id: album.id,
    title: album.title,
    coverMedia: album.coverMedia ? mapMediaItemToSummaryVM(album.coverMedia) : undefined,
    itemCount: album.items?.nodes?.length ?? 0,
    updatedAt: album.updatedAt,
    viewerOperations: album.viewerOperations?.map((o) => ViewerOperation.fromValue(o)) ?? [],
    viewerMemberRole: AlbumMemberRole.tryFromValue(album.viewerMemberRole),
  };
}

export function mapMultipleAlbumsToAlbumSummaryVMs(
  albums: (Omit<AlbumSummaryFragment, 'items'> & { items?: AlbumSummaryFragment['items'] })[],
): AlbumSummaryVM[] {
  return albums.map(mapAlbumToSummaryVM);
}
