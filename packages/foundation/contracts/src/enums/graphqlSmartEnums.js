/**
 * -----------------------------------------------------------------------------
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Any manual changes will be overwritten by GraphQL Code Generator.
 * -----------------------------------------------------------------------------
 */
import { enumeration } from '@reharik/smart-enum';
const albumItemSortByInput = {
    createdAt: { column: 'created_at' },
    orderIndex: { column: 'order_index' },
};
const albumSortByInput = {
    createdAt: { column: 'created_at' },
    title: { column: 'title' },
};
const errorCategoryInput = [
    'auth',
    'conflict',
    'domain',
    'network',
    'system',
    'validation',
];
const mediaAssetKindInput = ['display', 'original', 'thumbnail'];
const mediaAssetStatusInput = ['failed', 'pending', 'processing', 'ready'];
const mediaItemSortByInput = { createdAt: { column: 'created_at' } };
const mediaItemStatusInput = [
    'deleteFailed',
    'deletePending',
    'failed',
    'pending',
    'processing',
    'ready',
    'uploaded',
];
const mediaKindInput = ['photo', 'video'];
const sharePermissionInput = ['comment', 'download', 'view'];
const shareViewerRelationshipInput = ['anonymous', 'authenticated', 'member', 'owner'];
const sortDirInput = ['asc', 'desc'];
export const AlbumItemSortBy = enumeration('AlbumItemSortBy', {
    input: albumItemSortByInput,
});
export const AlbumSortBy = enumeration('AlbumSortBy', {
    input: albumSortByInput,
});
export const ErrorCategory = enumeration('ErrorCategory', {
    input: errorCategoryInput,
});
export const MediaAssetKind = enumeration('MediaAssetKind', {
    input: mediaAssetKindInput,
});
export const MediaAssetStatus = enumeration('MediaAssetStatus', {
    input: mediaAssetStatusInput,
});
export const MediaItemSortBy = enumeration('MediaItemSortBy', {
    input: mediaItemSortByInput,
});
export const MediaItemStatus = enumeration('MediaItemStatus', {
    input: mediaItemStatusInput,
});
export const MediaKind = enumeration('MediaKind', { input: mediaKindInput });
export const SharePermission = enumeration('SharePermission', {
    input: sharePermissionInput,
});
export const ShareViewerRelationship = enumeration('ShareViewerRelationship', { input: shareViewerRelationshipInput });
export const SortDir = enumeration('SortDir', { input: sortDirInput });
//# sourceMappingURL=graphqlSmartEnums.js.map