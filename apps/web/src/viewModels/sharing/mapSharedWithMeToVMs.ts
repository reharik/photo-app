// import { Operation } from '@packages/contracts';
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
//   operation: Operation.fromValue(node.operation),
//   mediaItem: mapMediaItemToSummaryVM(node.mediaItem),
// });

// const mapNodeToSharedAlbumVM = (node: SharedAlbumFragment): SharedAlbumVM => ({
//   ...node,
//   operation: Operation.fromValue(node.operation),
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
