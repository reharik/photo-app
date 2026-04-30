// import type { AlbumItemSummaryVM, UserAlbumItemSummaryVM } from './album/AlbumItemSummaryVM';
// import type { AlbumSummaryVM, UserAlbumSummaryVM } from './album/AlbumSummaryVM';
// import type { MediaItemDetailVM, UserMediaItemDetailVM } from './media/MediaItemDetailVM';
// import type { MediaItemSummaryVM, UserMediaItemSummaryVM } from './media/MediaItemSummaryVM';
// import type { PublicAlbumItemSummaryVM } from './publicAlbum/PublicAlbumItemSummaryVM';
// import type { PublicAlbumSummaryVM } from './publicAlbum/PublicAlbumSummaryVM';
// import type { PublicMediaItemSummaryVM } from './publicMedia/PublicMediaItemSummaryVM';

// export type ViewModelScope = 'user' | 'public';

// /**
//  * Summary list: user items include createdAt from the owner query; public items include mimeType
//  * and omit createdAt (see maps under `album/` vs `publicAlbum/`).
//  */
// export const isUserMediaItemSummaryVM = (vm: MediaItemSummaryVM): vm is UserMediaItemSummaryVM =>
//   Object.prototype.hasOwnProperty.call(vm, 'createdAt');

// export const isPublicMediaItemSummaryVM = (
//   vm: MediaItemSummaryVM,
// ): vm is PublicMediaItemSummaryVM =>
//   Object.prototype.hasOwnProperty.call(vm, 'mimeType') &&
//   !Object.prototype.hasOwnProperty.call(vm, 'createdAt');

// /**
//  * Detail: authenticated detail includes required `originalFileName`; public flow reuses the
//  * slimmer summary VM for the union branch (see MediaItemDetailVM).
//  */
// export const isUserMediaItemDetailVM = (vm: MediaItemDetailVM): vm is UserMediaItemDetailVM =>
//   Object.prototype.hasOwnProperty.call(vm, 'originalFileName');

// export const isPublicMediaItemDetailVM = (
//   vm: MediaItemDetailVM,
// ): vm is PublicMediaItemSummaryVM =>
//   !Object.prototype.hasOwnProperty.call(vm, 'originalFileName') &&
//   Object.prototype.hasOwnProperty.call(vm, 'mimeType');

// /**
//  * Album summaries: owner listing includes viewerIsOwner; public albums do not expose it.
//  */
// export const isUserAlbumSummaryVM = (vm: AlbumSummaryVM): vm is UserAlbumSummaryVM =>
//   Object.prototype.hasOwnProperty.call(vm, 'viewerIsOwner');

// export const isPublicAlbumSummaryVM = (vm: AlbumSummaryVM): vm is PublicAlbumSummaryVM =>
//   !Object.prototype.hasOwnProperty.call(vm, 'viewerIsOwner');

// /**
//  * Album items from owner queries include auditing timestamps on the item entity.
//  */
// export const isUserAlbumItemSummaryVM = (vm: AlbumItemSummaryVM): vm is UserAlbumItemSummaryVM =>
//   Object.prototype.hasOwnProperty.call(vm, 'createdAt');

// export const isPublicAlbumItemSummaryVM = (
//   vm: AlbumItemSummaryVM,
// ): vm is PublicAlbumItemSummaryVM => !Object.prototype.hasOwnProperty.call(vm, 'createdAt');
