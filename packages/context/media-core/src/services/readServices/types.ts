import {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  EntityType,
  MediaItemSortBy,
  MediaItemStatus,
  MediaKind,
  Operation,
  ReactionEmoji,
  SharedWithMeAlbumSortBy,
  SharedWithMeMediaItemSortBy,
  SortDir,
} from '@packages/contracts';
import { CollectionInfo, EntityId, PageInfo } from '../../types';

export type PagedList<T> = {
  nodes: T[];
  totalCount: number;
};

export type AlbumProjection = {
  id: string;
  itemCount: number;
  viewerMemberRole?: AlbumMemberRole;
  title: string;
  description?: string;
  coverMediaId?: string;
  coverMedia?: MediaItemProjection;
  createdAt: Date;
  updatedAt: Date;
  hasUnseen: boolean;
  operations: Operation[];
};

export type AlbumItemProjection = {
  id: string;
  /** Sparse bigint order index as string (GraphQL-safe). */
  orderIndex: string;
  createdAt: Date;
  updatedAt: Date;
  mediaItem: MediaItemProjection;
  operations: Operation[];
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
  mediaItemReactionCounts: DBReactionCounts;
};

export type AlbumWithCoverRow = {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  viewerMemberRole?: AlbumMemberRole;
  itemCount: number;
  hasUnseen: boolean;
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

export interface SharedWithMeAlbumCollectionInfo extends CollectionInfo<SharedWithMeAlbumSortBy> {
  pageInfo: PageInfo;
  sortBy: SharedWithMeAlbumSortBy;
  sortDir: SortDir;
}
export interface SharedWithMeMediaItemCollectionInfo extends CollectionInfo<SharedWithMeMediaItemSortBy> {
  pageInfo: PageInfo;
  sortBy: SharedWithMeMediaItemSortBy;
  sortDir: SortDir;
}

export type AuthorizationProjection = {
  id: EntityId;
  grantedToUserId?: EntityId;
  operations: Operation[];
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt?: Date;
};

export type SharedWithMeItemProjection = {
  id: EntityId;
  sharedAt: Date;
  sharedBy: EntityId;
  sharedByFirstName: string;
  sharedByLastName: string;
  mediaItem: MediaItemProjection;
};

export type SharedWithMeAlbumProjection = {
  id: EntityId;
  sharedAt: Date;
  sharedBy: EntityId;
  sharedByFirstName: string;
  sharedByLastName: string;
  album: AlbumProjection;
};

export type Reactor = {
  firstName?: string;
  lastName?: string;
  userId: EntityId;
};
export type ReactionCount = {
  emoji: ReactionEmoji;
  reactors: Reactor[];
  count: number;
};

export type ReactionCounts = {
  total: number;
  byEmoji: ReactionCount[];
};

export interface DBMediaItemRow {
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
  reactionCounts: DBReactionCounts;
  takenAtUtcOffsetMinutes?: number;
}
export type MediaItemProjection = Omit<DBMediaItemRow, 'reactionCounts'> & MediaItemChildren;

export type MediaItemChildren = {
  reactionCounts: ReactionCounts;
  viewerReactions: ViewerReaction[];
  tags: string[];
  operations: Operation[];
};

export type DBReactionCounts = {
  total: number;
  byEmoji: {
    emoji: string;
    count: number;
    reactors: {
      firstName?: string;
      lastName?: string;
      userId: EntityId;
    }[];
  }[];
};

export interface MediaItemCollectionInfo extends CollectionInfo<MediaItemSortBy> {
  pageInfo: PageInfo;
  sortBy: MediaItemSortBy;
  sortDir: SortDir;
}

export interface PublicAlbumItemCollectionInfo extends CollectionInfo<AlbumItemSortBy> {
  pageInfo: PageInfo;
  sortBy: AlbumItemSortBy;
  sortDir: SortDir;
}

export type PublicAlbumProjection = {
  id: string;
  itemCount: number;
  viewerMemberRole?: AlbumMemberRole;
  title: string;
  description?: string;
  coverMediaId?: string;
  coverMedia?: PublicMediaItemProjection;
  createdAt: Date;
  updatedAt: Date;
  operations: Operation[];
};

export type PublicAlbumItemProjection = {
  id: string;
  /** Sparse bigint order index as string (GraphQL-safe). */
  orderIndex: string;
  createdAt: Date;
  updatedAt: Date;
  mediaItem: PublicMediaItemProjection;
};

export interface DBPublicMediaItemRow {
  id: EntityId;
  kind: MediaKind;
  status: MediaItemStatus;
  title?: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  reactionCounts: DBReactionCounts;
}

export type PublicMediaItemProjection = Omit<DBPublicMediaItemRow, 'reactionCounts'> &
  MediaItemChildren;

export type CommentRow = {
  id: EntityId;
  targetType: EntityType;
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
  viewerReactions: ViewerReaction[];
};
export type CommentGraph = CommentRow & {
  replies: CommentRow[];
};

export type ViewerReaction = {
  id: EntityId;
  emoji: ReactionEmoji;
};
