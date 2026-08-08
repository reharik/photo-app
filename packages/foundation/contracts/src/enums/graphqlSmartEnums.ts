/**
 * -----------------------------------------------------------------------------
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Any manual changes will be overwritten by GraphQL Code Generator.
 * -----------------------------------------------------------------------------
 */

import { enumeration, type Enumeration } from '@reharik/smart-enum';

const activitySurfaceInput = ['albums', 'recent', 'sharedAlbums'] as const;
const albumItemSortByInput = {
  createdAt: { column: 'created_at', table: 'album_item', nullsLast: 'false' },
  orderIndex: { column: 'order_index', table: 'album_item', nullsLast: 'false' },
  takenAt: { column: 'taken_at', table: 'media_item', nullsLast: 'true' },
} as const;
const albumMemberSortByInput = {
  role: { column: 'role', table: 'album_member', nullsLast: 'true' },
} as const;
const albumSortByInput = {
  createdAt: { column: 'created_at', table: 'album', nullsLast: 'false' },
  title: { column: 'title', table: 'album', nullsLast: 'true' },
} as const;
const entityTypeInput = [
  'album',
  'authorization',
  'comment',
  'mediaItem',
  'reaction',
  'user',
] as const;
const errorCategoryInput = [
  'auth',
  'conflict',
  'domain',
  'network',
  'system',
  'validation',
] as const;
const inAppNotificationTypeInput = [
  'albumShared',
  'commentPosted',
  'itemAdded',
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
const sortDirInput = ['asc', 'desc'] as const;

export type ActivitySurface = Enumeration<typeof ActivitySurface>;
export type AlbumItemSortBy = Enumeration<typeof AlbumItemSortBy>;
export type AlbumMemberSortBy = Enumeration<typeof AlbumMemberSortBy>;
export type AlbumSortBy = Enumeration<typeof AlbumSortBy>;
export type EntityType = Enumeration<typeof EntityType>;
export type ErrorCategory = Enumeration<typeof ErrorCategory>;
export type InAppNotificationType = Enumeration<typeof InAppNotificationType>;
export type MediaAssetKind = Enumeration<typeof MediaAssetKind>;
export type MediaAssetStatus = Enumeration<typeof MediaAssetStatus>;
export type MediaItemSortBy = Enumeration<typeof MediaItemSortBy>;
export type MediaItemStatus = Enumeration<typeof MediaItemStatus>;
export type MediaKind = Enumeration<typeof MediaKind>;
export type SharedWithMeAlbumSortBy = Enumeration<typeof SharedWithMeAlbumSortBy>;
export type SortDir = Enumeration<typeof SortDir>;

export const ActivitySurface = enumeration<typeof activitySurfaceInput>('ActivitySurface', {
  input: activitySurfaceInput,
  serializeAs: 'value',
});
export const AlbumItemSortBy = enumeration<typeof albumItemSortByInput>('AlbumItemSortBy', {
  input: albumItemSortByInput,
  serializeAs: 'value',
});
export const AlbumMemberSortBy = enumeration<typeof albumMemberSortByInput>('AlbumMemberSortBy', {
  input: albumMemberSortByInput,
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
export const ErrorCategory = enumeration<typeof errorCategoryInput>('ErrorCategory', {
  input: errorCategoryInput,
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
export const SortDir = enumeration<typeof sortDirInput>('SortDir', {
  input: sortDirInput,
  serializeAs: 'value',
});

/** any key not in the schema resolves to `never`, so unknown keys are rejected */
type Exact<X, K extends string> = X & Record<Exclude<keyof X, K>, never>;

export const albumMemberRoleKeys = ['admin', 'contributor', 'owner'] as const;
export type AlbumMemberRoleKeys = (typeof albumMemberRoleKeys)[number];

/**
 * Pin the AlbumMemberRole input to the schema's value set.
 *
 * One entry per schema value. A missing key or a key not in the schema is a
 * compile error, so this enum cannot drift from the SDL. Values and display
 * strings are derived from the key; unlike generated enums, schema
 * descriptions are NOT applied as display strings. Pass `display` in an
 * entry to use them, or `value` to override the wire value.
 *
 * Returns the input unchanged (typed): build the enum from it exactly like
 * any other smart enum. The return type is the plain input type so that
 * declaration emit in consuming packages stays cheap.
 *
 * @param input Per-member extras, keyed by schema value.
 * @example
 * ```ts
 * import { enumeration, type Enumeration } from '@reharik/smart-enum';
 *
 * const input = defineAlbumMemberRoleInput({
 *   admin: { some: 'extra' },
 *   // ...one entry per schema value
 * });
 *
 * export type AlbumMemberRole = Enumeration<typeof AlbumMemberRole>;
 * export const AlbumMemberRole = enumeration<typeof input>('AlbumMemberRole', {
 *   input,
 *   serializeAs: 'value',
 * });
 * ```
 */
export const defineAlbumMemberRoleInput = <
  const X extends Record<AlbumMemberRoleKeys, Record<string, unknown>>,
>(
  input: Exact<X, AlbumMemberRoleKeys>,
): X => input;

export const operationKeys = [
  'addItems',
  'addMembers',
  'comment',
  'deleteAlbum',
  'deleteMediaItem',
  'download',
  'editCover',
  'editDetails',
  'editMediaItem',
  'grantAlbumAuthorization',
  'grantMediaItemAlbumAuthorization',
  'removeItems',
  'removeMembers',
] as const;
export type OperationKeys = (typeof operationKeys)[number];

/**
 * Pin the Operation input to the schema's value set.
 *
 * One entry per schema value. A missing key or a key not in the schema is a
 * compile error, so this enum cannot drift from the SDL. Values and display
 * strings are derived from the key; unlike generated enums, schema
 * descriptions are NOT applied as display strings. Pass `display` in an
 * entry to use them, or `value` to override the wire value.
 *
 * Returns the input unchanged (typed): build the enum from it exactly like
 * any other smart enum. The return type is the plain input type so that
 * declaration emit in consuming packages stays cheap.
 *
 * @param input Per-member extras, keyed by schema value.
 * @example
 * ```ts
 * import { enumeration, type Enumeration } from '@reharik/smart-enum';
 *
 * const input = defineOperationInput({
 *   addItems: { some: 'extra' },
 *   // ...one entry per schema value
 * });
 *
 * export type Operation = Enumeration<typeof Operation>;
 * export const Operation = enumeration<typeof input>('Operation', {
 *   input,
 *   serializeAs: 'value',
 * });
 * ```
 */
export const defineOperationInput = <
  const X extends Record<OperationKeys, Record<string, unknown>>,
>(
  input: Exact<X, OperationKeys>,
): X => input;

export const reactionEmojiKeys = ['comment', 'heart'] as const;
export type ReactionEmojiKeys = (typeof reactionEmojiKeys)[number];

/**
 * Pin the ReactionEmoji input to the schema's value set.
 *
 * One entry per schema value. A missing key or a key not in the schema is a
 * compile error, so this enum cannot drift from the SDL. Values and display
 * strings are derived from the key; unlike generated enums, schema
 * descriptions are NOT applied as display strings. Pass `display` in an
 * entry to use them, or `value` to override the wire value.
 *
 * Returns the input unchanged (typed): build the enum from it exactly like
 * any other smart enum. The return type is the plain input type so that
 * declaration emit in consuming packages stays cheap.
 *
 * @param input Per-member extras, keyed by schema value.
 * @example
 * ```ts
 * import { enumeration, type Enumeration } from '@reharik/smart-enum';
 *
 * const input = defineReactionEmojiInput({
 *   comment: { some: 'extra' },
 *   // ...one entry per schema value
 * });
 *
 * export type ReactionEmoji = Enumeration<typeof ReactionEmoji>;
 * export const ReactionEmoji = enumeration<typeof input>('ReactionEmoji', {
 *   input,
 *   serializeAs: 'value',
 * });
 * ```
 */
export const defineReactionEmojiInput = <
  const X extends Record<ReactionEmojiKeys, Record<string, unknown>>,
>(
  input: Exact<X, ReactionEmojiKeys>,
): X => input;
