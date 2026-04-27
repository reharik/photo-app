import { SharePermission } from '@packages/contracts';
import {
  SharedAlbumFragment,
  SharedMediaItemFragment,
  ViewerSharedWithMeQuery,
} from '../../graphql/generated/types';
import { mapAlbumToAlbumSummaryVM } from '../album/mapAlbumToAlbumSummaryVM';
import { mapMediaItemToMediaItemSummaryVM } from '../media/mapMediaItemToMediaItemSummaryVM';
import { SharedAlbumVM } from './SharedAlbumVM';
import { SharedMediaItemVM } from './SharedMediaItemVM';

type SharedWithMeQuerySlice = NonNullable<
  NonNullable<ViewerSharedWithMeQuery['viewer']>['sharedWithMe']
>;

const mapNodeToSharedMediaItemVM = (node: SharedMediaItemFragment): SharedMediaItemVM => ({
  ...node,
  permission: SharePermission.fromValue(node.permission),
  mediaItem: mapMediaItemToMediaItemSummaryVM(node.mediaItem),
});

const mapNodeToSharedAlbumVM = (node: SharedAlbumFragment): SharedAlbumVM => ({
  ...node,
  permission: SharePermission.fromValue(node.permission),
  album: mapAlbumToAlbumSummaryVM(node.album),
});

export const mapSharedWithMeQueryToVMs = (
  data: SharedWithMeQuerySlice,
): { sharedMediaItems: SharedMediaItemVM[]; sharedAlbums: SharedAlbumVM[] } => {
  return {
    sharedMediaItems: data.mediaItems.map(mapNodeToSharedMediaItemVM),
    sharedAlbums: data.albums.map(mapNodeToSharedAlbumVM),
  };
};
