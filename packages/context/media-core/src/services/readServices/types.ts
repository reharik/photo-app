import {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  CommentTargetType,
  MediaItemSortBy,
  MediaItemStatus,
  MediaKind,
  ReactionEmoji,
  SharePermission,
  SortDir,
  ViewerOperation,
} from '@packages/contracts';
import { CollectionInfo, EntityId, PageInfo } from '../../types';

export type AlbumListProjection = {
  nodes: AlbumProjection[];
  pageInfo: PageInfo;
};

export type AlbumItemListProjection = {
  nodes: AlbumItemProjection[];
  pageInfo: PageInfo;
};

export type AlbumProjection = {
  id: string;
  viewerMemberRole?: AlbumMemberRole;
  title: string;
  description?: string;
  coverMediaId?: string;
  coverMedia?: MediaItemProjection;
  createdAt: Date;
  updatedAt: Date;
};

export type AlbumItemProjection = {
  id: string;
  /** Sparse bigint order index as string (GraphQL-safe). */
  orderIndex: string;
  createdAt: Date;
  updatedAt: Date;
  mediaItem: MediaItemProjection;
};

export type NamespacedMediaItemRow = {
  mediaItemId: EntityId;
  mediaItemOwnerId: EntityId;
  mediaItemKind: MediaKind;
  mediaItemStatus: MediaItemStatus;
  mediaItemMimeType?: string;
  mediaItemSizeBytes?: number;
  mediaItemOriginalFileName?: string;
  mediaItemWidth?: number;
  mediaItemHeight?: number;
  mediaItemDurationSeconds?: number;
  mediaItemTitle?: string;
  mediaItemDescription?: string;
  mediaItemTakenAt?: Date;
  mediaItemCreatedAt: Date;
  mediaItemUpdatedAt: Date;
  mediaItemReactionCounts: ReactionCounts;
};

export type AlbumWithCoverRow = {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  viewerMemberRole?: AlbumMemberRole;
} & NamespacedMediaItemRow;

export type AlbumItemWithMediaRow = {
  id: EntityId;
  albumItemOrderIndex: string;
  createdAt: Date;
  updatedAt: Date;
  viewerMemberRole?: AlbumMemberRole;
} & NamespacedMediaItemRow;

export interface AlbumCollectionInfo extends CollectionInfo<AlbumSortBy> {
  pageInfo: PageInfo;
  sortBy: AlbumSortBy;
  sortDir: SortDir;
}

export interface AlbumItemCollectionInfo extends CollectionInfo<AlbumItemSortBy> {
  pageInfo: PageInfo;
  sortBy: AlbumItemSortBy;
  sortDir: SortDir;
}

export type AuthorizationProjection = {
  id: EntityId;
  grantedToUserId?: EntityId;
  permission: SharePermission;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt?: Date;
};

export type SharedWithMeItemProjection = {
  id: EntityId;
  sharedAt: Date;
  sharedBy: EntityId;
  mediaItem: MediaItemProjection;
};

export type ReactionCount = {
  emoji: ReactionEmoji;
  count: number;
};

export type ReactionCounts = {
  total: number;
  byEmoji: ReactionCount[];
};

export type MediaItemListProjection = {
  nodes: MediaItemProjection[];
  pageInfo: PageInfo;
};

export interface MediaItemRow {
  id: EntityId;
  ownerId: EntityId;
  kind: MediaKind;
  status: MediaItemStatus;
  mimeType: string;
  sizeBytes?: number;
  originalFileName?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  title?: string;
  description?: string;
  takenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  reactionCounts: ReactionCounts;
  viewerReactions: ViewerReaction[];
}
export type DBMediaItemRow = Omit<MediaItemRow, 'reactionCounts'> & {
  reactionCounts: DBReactionCounts;
};
export type DBReactionCounts = { total: number; byEmoji: { emoji: string; count: number }[] };
export interface MediaItemProjection extends MediaItemRow {
  tags: string[];
  reactionCounts: ReactionCounts;
  viewerReactions: ViewerReaction[];
}

export interface MediaItemCollectionInfo extends CollectionInfo<MediaItemSortBy> {
  pageInfo: PageInfo;
  sortBy: MediaItemSortBy;
  sortDir: SortDir;
}

export interface HasId {
  id: EntityId;
}

export type UnDecoratedItem<T extends HasId> = T;

export type DecoratedItem<T extends HasId> = T & {
  viewerIsOwner: boolean;
  viewerOperations: ViewerOperation[];
};

export type UnDecoratedNestedMediaItem<T extends HasId, U extends HasId> = T & {
  mediaItem: UnDecoratedItem<U>;
};

export type DecoratedNestedMediaItem<T extends HasId, U extends HasId> = T & {
  viewerIsOwner: boolean;
  viewerOperations: ViewerOperation[];
  mediaItem: DecoratedItem<U>;
};

export type PublicAlbumItemListProjection = {
  nodes: PublicAlbumItemProjection[];
  pageInfo: PageInfo;
};

export interface PublicAlbumItemCollectionInfo extends CollectionInfo<AlbumItemSortBy> {
  pageInfo: PageInfo;
  sortBy: AlbumItemSortBy;
  sortDir: SortDir;
}

export type PublicAlbumProjection = {
  id: string;
  viewerMemberRole?: AlbumMemberRole;
  title: string;
  description?: string;
  coverMediaId?: string;
  coverMedia?: PublicMediaItemProjection;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicAlbumItemProjection = {
  id: string;
  /** Sparse bigint order index as string (GraphQL-safe). */
  orderIndex: string;
  createdAt: Date;
  updatedAt: Date;
  mediaItem: PublicMediaItemProjection;
};

export interface PublicMediaItemRow {
  id: EntityId;
  kind: MediaKind;
  status: MediaItemStatus;
  title?: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  reactionCounts: ReactionCounts;
}

export interface PublicMediaItemProjection extends PublicMediaItemRow {
  tags: string[];
}

export type CommentRow = {
  id: EntityId;
  targetType: CommentTargetType;
  targetId: EntityId;
  parentCommentId?: EntityId;
  authorId?: EntityId;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  totalCount: number;
  reactionCounts: ReactionCounts;
};
export type CommentGraph = CommentRow & {
  replies: CommentRow[];
};

export type ViewerReaction = {
  id: EntityId;
  emoji: ReactionEmoji;
};
