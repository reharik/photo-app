import {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  CommentTargetType,
  Operation,
  ReactionEmoji,
  ReactionTargetType,
  User,
} from '@packages/contracts';
import type { Knex } from 'knex';
import { AuditRecord } from '../..';
import {
  AlbumItemWithMediaRow,
  AlbumWithCoverRow,
  CommentRow,
  DBMediaItemRow,
  DBPublicMediaItemRow,
  DBReactionCounts,
  MediaItemCollectionInfo,
  NamespacedMediaItemRow,
  PagedList,
  SharedWithMeAlbumCollectionInfo,
  SharedWithMeMediaItemCollectionInfo,
} from '../../services/readServices/types';
import type { CollectionInfo, EntityId, PageInfo } from '../../types/types';

export type ReadRepositoryDeps = { database: Knex };

export type AuthorizationRow = {
  id: EntityId;
  grantedToUser?: EntityId;
  operations: Operation[];
  description?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
};

export type MediaItemOperations = {
  mediaItemId: EntityId;
  operations: Operation[];
};

export type MediaItemOperationsRow = {
  mediaItemId: EntityId;
  operations: Operation[];
};

export type AuthorizationReadRepository = {
  getGrantedAuthorizationsForOwnedMediaItem: (args: {
    mediaItemId: EntityId;
    ownerId: EntityId;
  }) => Promise<AuthorizationRow[]>;
  getGrantedAuthorizationsForOwnedAlbum: (args: {
    albumId: EntityId;
    ownerId: EntityId;
  }) => Promise<AuthorizationRow[]>;
  getMediaItemOperationsFromGrants: (
    viewerId: EntityId,
    mediaItemIds: EntityId[],
  ) => Promise<MediaItemOperations[]>;
  getPublicMediaItemOperationsFromGrants: (
    publicLinkId: EntityId,
    mediaItemIds: EntityId[],
  ) => Promise<MediaItemOperations[]>;
};

export type HasActiveGrantInput = {
  mediaItemId: string;
  viewerId?: string;
  tokenHash?: string;
};

export type HasActiveGrantPermissionInput = {
  mediaItemId: string;
  viewerId: string;
  operation: Operation;
};

export type HasActiveAccessGrantPermissionInput = {
  albumId: string;
  viewerId: string;
  operation: Operation;
};

export type GrantReadRepository = {
  hasActiveGrant: (input: HasActiveGrantInput) => Promise<boolean>;
  hasActiveGrantPermission: (input: HasActiveGrantPermissionInput) => Promise<boolean>;
  hasActiveAccessGrantPermission: (input: HasActiveAccessGrantPermissionInput) => Promise<boolean>;
};

export type AlbumReadRepository = {
  listByViewerId: ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumSortBy>;
  }) => Promise<PagedList<AlbumWithCoverRow>>;
  getAlbumForViewer: ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }) => Promise<AlbumWithCoverRow | undefined>;
  getViewableAlbumItemsForViewer: ({
    albumId,
    viewerId,
    collectionInfo,
  }: {
    albumId: string;
    viewerId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }) => Promise<PagedList<AlbumItemWithMediaRow>>;
  findAlbumIdsReferencingMediaItem: ({
    mediaItemId,
  }: {
    mediaItemId: string;
  }) => Promise<AlbumIdRow[]>;
  getAlbumForShareLink: ({
    albumId,
    publicLinkId,
  }: {
    albumId: string;
    publicLinkId: string;
  }) => Promise<AlbumWithCoverRow | undefined>;
  /** Album items for public share-link viewing (no membership check). READY media only. */
  listAlbumItemsForShareLink: ({
    albumId,
    publicLinkId,
    collectionInfo,
  }: {
    albumId: string;
    publicLinkId: string;
    collectionInfo: CollectionInfo<AlbumItemSortBy>;
  }) => Promise<PagedList<AlbumItemWithMediaRow>>;
};

export type AlbumIdRow = { id: string };

export type AlbumMemberRow = {
  id: string;
  role: AlbumMemberRole;
};

export type AlbumMemberReadRepository = {
  getMemberByUserId: ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }) => Promise<AlbumMemberRow | undefined>;
};

export type ReactionRecord = {
  id: EntityId;
  targetType: ReactionTargetType;
  targetId: EntityId;
  userId: EntityId;
  emoji: ReactionEmoji;
} & AuditRecord;

export type DBCommentRow = Omit<CommentRow, 'reactionCounts'> & {
  reactionCounts: DBReactionCounts;
};

export type CommentReadRepository = {
  getCommentsForTarget: (args: {
    targetType: CommentTargetType;
    targetId: EntityId;
    collectionInfo: { pageInfo: PageInfo };
  }) => Promise<DBCommentRow[]>;
  getByIdForAuthorization: (args: { commentId: EntityId }) => Promise<DBCommentRow | undefined>;
};

export type ReactionReadRepository = {
  countForTarget: (args: { targetType: ReactionTargetType; targetId: EntityId }) => Promise<number>;
  viewerReactionsForTargets: (args: {
    viewerId: EntityId;
    targetType: ReactionTargetType;
    targetIds: EntityId[];
  }) => Promise<DbReactionRow[]>;
};

export type DbReactionRow = {
  id: EntityId;
  targetId: EntityId;
  emoji: ReactionEmoji;
};

export type ShareContactSuggestion = {
  userId: EntityId;
  handle: string;
};

export type ShareContactRow = {
  userId: EntityId;
  contactUserId: EntityId;
  handle: string;
  lastSharedAt: Date;
};

export type ShareContactRepository = {
  upsertContact: (
    userId: EntityId,
    contactUserId: EntityId,
    handle: string,
    trx: Knex.Transaction,
  ) => Promise<void>;
  getShareSuggestions: (userId: EntityId) => Promise<ShareContactSuggestion[]>;
};

export type SharedWithMeMediaItemRow = NamespacedMediaItemRow & {
  id: string;
  sharedBy: EntityId;
  sharedAt: Date;
};

export type SharedAlbumRow = {
  id: string;
  albumId: string;
  albumTitle: string;
  albumItemCount: number;
  albumCreatedAt: Date;
  albumUpdatedAt: Date;
  viewerMemberRole?: AlbumMemberRole;
  sharedBy: EntityId;
  sharedAt: Date;
} & NamespacedMediaItemRow; // cover item

export type SharedWithMeReadRepository = {
  getMediaItemsSharedWithMe: ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: SharedWithMeMediaItemCollectionInfo;
  }) => Promise<PagedList<SharedWithMeMediaItemRow>>;
  getAlbumsSharedWithMe: ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: SharedWithMeAlbumCollectionInfo;
  }) => Promise<PagedList<SharedAlbumRow>>;
};

export type MediaItemTagRow = {
  mediaItemId: EntityId;
  label: string;
};

export type MediaItemReadRepository = {
  /** Loads by id only (no ownership filter). Used for authz after access rules are applied. */
  getByIdForAuthorization: ({
    mediaItemId,
  }: {
    mediaItemId: EntityId;
  }) => Promise<DBMediaItemRow | undefined>;
  getForViewer: ({
    mediaItemId,
    viewerId,
  }: {
    mediaItemId: EntityId;
    viewerId: EntityId;
  }) => Promise<DBMediaItemRow | undefined>;
  getManyForViewer: ({
    mediaItemIds,
    viewerId,
  }: {
    mediaItemIds: EntityId[];
    viewerId: EntityId;
  }) => Promise<DBMediaItemRow[]>;
  listForViewer(args: {
    viewerId: EntityId;
    collectionInfo: MediaItemCollectionInfo;
  }): Promise<PagedList<DBMediaItemRow>>;
  listTagsForMediaItemIds: (args: { mediaItemIds: EntityId[] }) => Promise<MediaItemTagRow[]>;
};

export type UserReadRepository = {
  getById: (userId: EntityId) => Promise<User | undefined>;
};

export type PublicMediaItemReadRepository = {
  getPublicMediaItem: ({
    mediaItemId,
    publicLinkId,
  }: {
    mediaItemId: EntityId;
    publicLinkId: EntityId;
  }) => Promise<DBPublicMediaItemRow | undefined>;
};

export type PublicAccessRow = {
  id: string;
  albumId: string;
  linkToken: string;
  grantedBy: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type PublicAccessIdRow = { publicAccessId: string };

export type PublicAccessReadRepository = {
  getPublicAccessIdByHashedToken: (tokenHash: string) => Promise<PublicAccessIdRow | undefined>;
  getPublicAccessById: (publicAccessId: string) => Promise<PublicAccessRow | undefined>;
  canAccessMediaWithLink: (input: { tokenHash: string; mediaItemId: string }) => Promise<boolean>;
};
