/**
 * -----------------------------------------------------------------------------
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Any manual changes will be overwritten by GraphQL Code Generator.
 * -----------------------------------------------------------------------------
 */

import { enumeration, type Enumeration } from '@reharik/smart-enum';

const albumItemSortByInput = {
  createdAt: { column: 'created_at' },
  orderIndex: { column: 'order_index' },
} as const;
const albumSortByInput = {
  createdAt: { column: 'created_at' },
  title: { column: 'title' },
} as const;
const errorCategoryInput = [
  'auth',
  'conflict',
  'domain',
  'network',
  'system',
  'validation',
] as const;
const mediaAssetKindInput = ['display', 'original', 'thumbnail'] as const;
const mediaAssetStatusInput = ['failed', 'pending', 'processing', 'ready'] as const;
const mediaItemSortByInput = { createdAt: { column: 'created_at' } } as const;
const mediaItemStatusInput = [
  'deleteFailed',
  'deletePending',
  'failed',
  'pending',
  'processing',
  'ready',
  'uploaded',
] as const;
const mediaKindInput = ['photo', 'video'] as const;
const sharePermissionInput = ['comment', 'download', 'view'] as const;
const sortDirInput = ['asc', 'desc'] as const;

export type AlbumItemSortBy = Enumeration<typeof AlbumItemSortBy>;
export type AlbumSortBy = Enumeration<typeof AlbumSortBy>;
export type ErrorCategory = Enumeration<typeof ErrorCategory>;
export type MediaAssetKind = Enumeration<typeof MediaAssetKind>;
export type MediaAssetStatus = Enumeration<typeof MediaAssetStatus>;
export type MediaItemSortBy = Enumeration<typeof MediaItemSortBy>;
export type MediaItemStatus = Enumeration<typeof MediaItemStatus>;
export type MediaKind = Enumeration<typeof MediaKind>;
export type SharePermission = Enumeration<typeof SharePermission>;
export type SortDir = Enumeration<typeof SortDir>;

export const AlbumItemSortBy = enumeration<typeof albumItemSortByInput>('AlbumItemSortBy', {
  input: albumItemSortByInput,
  serializeAs: 'value',
});
export const AlbumSortBy = enumeration<typeof albumSortByInput>('AlbumSortBy', {
  input: albumSortByInput,
  serializeAs: 'value',
});
export const ErrorCategory = enumeration<typeof errorCategoryInput>('ErrorCategory', {
  input: errorCategoryInput,
  serializeAs: 'value',
});
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
export const SharePermission = enumeration<typeof sharePermissionInput>('SharePermission', {
  input: sharePermissionInput,
  serializeAs: 'value',
});
export const SortDir = enumeration<typeof sortDirInput>('SortDir', {
  input: sortDirInput,
  serializeAs: 'value',
});

export const enumRegistry = {
  AlbumItemSortBy,
  AlbumSortBy,
  ErrorCategory,
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemSortBy,
  MediaItemStatus,
  MediaKind,
  SharePermission,
  SortDir,
} as const;
