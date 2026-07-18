/**
 * -----------------------------------------------------------------------------
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Any manual changes will be overwritten by GraphQL Code Generator.
 * -----------------------------------------------------------------------------
 */

import { enumeration, type Enumeration } from '@reharik/smart-enum';

import { AlbumMemberRole } from './albumMemberRole';
import { ErrorCategory } from './ContractError';
import { Operation } from './operation';
import { ReactionEmoji } from './reactionEmojis';

const albumItemSortByInput = {
  createdAt: { column: 'created_at', table: 'album_item', nullsLast: 'false' },
  orderIndex: { column: 'order_index', table: 'album_item', nullsLast: 'false' },
  takenAt: { column: 'taken_at', table: 'media_item', nullsLast: 'true' },
} as const;
const albumSortByInput = {
  createdAt: { column: 'created_at', table: 'album', nullsLast: 'false' },
  title: { column: 'title', table: 'album', nullsLast: 'true' },
} as const;
const entityTypeInput = [
  'album',
  'comment',
  'mediaItem',
  'notification',
  'reaction',
  'user',
] as const;
const inAppNotificationTypeInput = [
  'albumShared',
  'commentPosted',
  'itemAdded',
  'itemShared',
  'replyPosted',
] as const;
const mediaAssetKindInput = ['display', 'original', 'thumbnail'] as const;
const mediaAssetStatusInput = ['failed', 'pending', 'processing', 'ready'] as const;
const mediaItemSortByInput = {
  createdAt: { column: 'created_at', table: 'media_item', nullsLast: 'false' },
  takenAt: { column: 'taken_at', table: 'media_item', nullsLast: 'true' },
} as const;
const mediaItemStatusInput = [
  'deleteFailed',
  'deletePending',
  'failed',
  'pending',
  'processing',
  'ready',
  'succeeded',
  'uploaded',
] as const;
const mediaKindInput = ['photo', 'video'] as const;
const sharedWithMeAlbumSortByInput = {
  sharedAt: { column: 'created_at', table: 'access_grant', nullsLast: 'true' },
} as const;
const sharedWithMeMediaItemSortByInput = {
  sharedAt: { column: 'created_at', table: 'access_grant', nullsLast: 'true' },
} as const;
const sortDirInput = ['asc', 'desc'] as const;

export type AlbumItemSortBy = Enumeration<typeof AlbumItemSortBy>;
export type AlbumSortBy = Enumeration<typeof AlbumSortBy>;
export type EntityType = Enumeration<typeof EntityType>;
export type InAppNotificationType = Enumeration<typeof InAppNotificationType>;
export type MediaAssetKind = Enumeration<typeof MediaAssetKind>;
export type MediaAssetStatus = Enumeration<typeof MediaAssetStatus>;
export type MediaItemSortBy = Enumeration<typeof MediaItemSortBy>;
export type MediaItemStatus = Enumeration<typeof MediaItemStatus>;
export type MediaKind = Enumeration<typeof MediaKind>;
export type SharedWithMeAlbumSortBy = Enumeration<typeof SharedWithMeAlbumSortBy>;
export type SharedWithMeMediaItemSortBy = Enumeration<typeof SharedWithMeMediaItemSortBy>;
export type SortDir = Enumeration<typeof SortDir>;

export const AlbumItemSortBy = enumeration<typeof albumItemSortByInput>('AlbumItemSortBy', {
  input: albumItemSortByInput,
  serializeAs: 'value',
});
export const AlbumSortBy = enumeration<typeof albumSortByInput>('AlbumSortBy', {
  input: albumSortByInput,
  serializeAs: 'value',
});
export const EntityType = enumeration<typeof entityTypeInput>('EntityType', {
  input: entityTypeInput,
  serializeAs: 'value',
});
export const InAppNotificationType = enumeration<typeof inAppNotificationTypeInput>(
  'InAppNotificationType',
  { input: inAppNotificationTypeInput, serializeAs: 'value' },
);
export const MediaAssetKind = enumeration<typeof mediaAssetKindInput>('MediaAssetKind', {
  input: mediaAssetKindInput,
  serializeAs: 'value',
});
export const MediaAssetStatus = enumeration<typeof mediaAssetStatusInput>('MediaAssetStatus', {
  input: mediaAssetStatusInput,
  serializeAs: 'value',
});
export const MediaItemSortBy = enumeration<typeof mediaItemSortByInput>('MediaItemSortBy', {
  input: mediaItemSortByInput,
  serializeAs: 'value',
});
export const MediaItemStatus = enumeration<typeof mediaItemStatusInput>('MediaItemStatus', {
  input: mediaItemStatusInput,
  serializeAs: 'value',
});
export const MediaKind = enumeration<typeof mediaKindInput>('MediaKind', {
  input: mediaKindInput,
  serializeAs: 'value',
});
export const SharedWithMeAlbumSortBy = enumeration<typeof sharedWithMeAlbumSortByInput>(
  'SharedWithMeAlbumSortBy',
  { input: sharedWithMeAlbumSortByInput, serializeAs: 'value' },
);
export const SharedWithMeMediaItemSortBy = enumeration<typeof sharedWithMeMediaItemSortByInput>(
  'SharedWithMeMediaItemSortBy',
  { input: sharedWithMeMediaItemSortByInput, serializeAs: 'value' },
);
export const SortDir = enumeration<typeof sortDirInput>('SortDir', {
  input: sortDirInput,
  serializeAs: 'value',
});

export const enumRegistry = {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  EntityType,
  ErrorCategory,
  InAppNotificationType,
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemSortBy,
  MediaItemStatus,
  MediaKind,
  Operation,
  ReactionEmoji,
  SharedWithMeAlbumSortBy,
  SharedWithMeMediaItemSortBy,
  SortDir,
} as const;
