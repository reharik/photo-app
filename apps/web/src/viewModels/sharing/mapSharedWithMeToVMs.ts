// import { SharePermission } from '@packages/contracts';
// import {
//   SharedAlbumFragment,
//   SharedWithMedMediaItemFragment,
//   ViewerSharedWithMeQuery,
// } from '../../graphql/generated/types';
// import { mapAlbumToSummaryVM } from '../album/mapAlbumToSummaryVM';
// import { mapMediaItemToSummaryVM } from '../media/mapMediaItemToSummaryVM';
// import { SharedAlbumVM } from './SharedAlbumVM';
// import { SharedWithMedMediaItemVM } from './SharedWithMedMediaItemVM';

// type SharedWithMeQuerySlice = NonNullable<
//   NonNullable<ViewerSharedWithMeQuery['viewer']>['sharedWithMe']
// >;

// const mapNodeToSharedWithMedMediaItemVM = (node: SharedWithMedMediaItemFragment): SharedWithMedMediaItemVM => ({
//   ...node,
//   permission: SharePermission.fromValue(node.permission),
//   mediaItem: mapMediaItemToSummaryVM(node.mediaItem),
// });

// const mapNodeToSharedAlbumVM = (node: SharedAlbumFragment): SharedAlbumVM => ({
//   ...node,
//   permission: SharePermission.fromValue(node.permission),
//   album: mapAlbumToSummaryVM(node.album),
// });

// export const mapSharedWithMeQueryToVMs = (
//   data: SharedWithMeQuerySlice,
// ): { sharedWithMeMediaItems: SharedWithMedMediaItemVM[]; sharedAlbums: SharedAlbumVM[] } => {
//   return {
//     sharedWithMeMediaItems: data.mediaItems.map(mapNodeToSharedWithMedMediaItemVM),
//     sharedAlbums: data.albums.map(mapNodeToSharedAlbumVM),
//   };
// };
