/**
 * -----------------------------------------------------------------------------
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Any manual changes will be overwritten by GraphQL Code Generator.
 * -----------------------------------------------------------------------------
 */

import { enumeration, type Enumeration } from '@reharik/smart-enum';

const albumItemSortByInput = ['createdAt', 'orderIndex'] as const;
const albumSortByInput = ['createdAt', 'title'] as const;
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
const mediaItemSortByInput = ['createdAt'] as const;
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
const shareViewerRelationshipInput = ['anonymous', 'authenticated', 'member', 'owner'] as const;
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
export type ShareViewerRelationship = Enumeration<typeof ShareViewerRelationship>;
export type SortDir = Enumeration<typeof SortDir>;

export const AlbumItemSortBy = enumeration<typeof albumItemSortByInput>('AlbumItemSortBy', {
  input: albumItemSortByInput,
});
export const AlbumSortBy = enumeration<typeof albumSortByInput>('AlbumSortBy', {
  input: albumSortByInput,
});
export const ErrorCategory = enumeration<typeof errorCategoryInput>('ErrorCategory', {
  input: errorCategoryInput,
});
export const MediaAssetKind = enumeration<typeof mediaAssetKindInput>('MediaAssetKind', {
  input: mediaAssetKindInput,
});
export const MediaAssetStatus = enumeration<typeof mediaAssetStatusInput>('MediaAssetStatus', {
  input: mediaAssetStatusInput,
});
export const MediaItemSortBy = enumeration<typeof mediaItemSortByInput>('MediaItemSortBy', {
  input: mediaItemSortByInput,
});
export const MediaItemStatus = enumeration<typeof mediaItemStatusInput>('MediaItemStatus', {
  input: mediaItemStatusInput,
});
export const MediaKind = enumeration<typeof mediaKindInput>('MediaKind', { input: mediaKindInput });
export const SharePermission = enumeration<typeof sharePermissionInput>('SharePermission', {
  input: sharePermissionInput,
});
export const ShareViewerRelationship = enumeration<typeof shareViewerRelationshipInput>(
  'ShareViewerRelationship',
  { input: shareViewerRelationshipInput },
);
export const SortDir = enumeration<typeof sortDirInput>('SortDir', { input: sortDirInput });
