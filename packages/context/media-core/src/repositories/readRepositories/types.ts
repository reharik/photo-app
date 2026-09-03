import {
  AlbumMemberRole,
  AlbumSortBy,
  AuthorizationKind,
  AuthorizationOrigin,
  EmailDeliveryState,
  EmailStatus,
  EntityType,
  Operation,
  ReactionEmoji,
  UserStatus,
} from '@packages/contracts';
import { AuditRecord, UnitOfWork } from '../..';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import {
  AlbumMemberCollectionInfo,
  AlbumWithCoverRow,
  CommentRow,
  DBMediaItemRow,
  DBPublicMediaItemRow,
  DBReactionCounts,
  MediaItemCollectionInfo,
  PagedList,
  SharedWithMeAlbumCollectionInfo,
  UserRow,
} from '../../services/readServices/types';
import type { CollectionInfo, EntityId, PageInfo } from '../../types/types';

export type ReadRepositoryDeps = { uow: UnitOfWork };

export type AuthorizationRow = {
  id: EntityId;
  grantedToUser?: EntityId;
  linkToken?: string;
  albumId: EntityId;
  operations: Operation[];
  description?: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  kind: AuthorizationKind;
  origin: AuthorizationOrigin;
};

export type MediaItemOperations = {
  mediaItemId: EntityId;
  operations: Operation[];
};

export type MediaItemOperationsRow = {
  mediaItemId: EntityId;
  operations: Operation[];
};

/**
 * The three-way collapse of EmailStatus the share roster renders. The raw
 * status never leaves the read service — see DELIVERY_STATE_BY_EMAIL_STATE.
 */
export type EmailShareDelivery = {
  state: EmailDeliveryState;
  /** SES event time once one has arrived, otherwise the send time. */
  at: Date;
};

export type EmailShare = {
  id: EntityId;
  email: string;
  displayName?: string;
  hasAccount: boolean;
  userId?: string;
  createdAt: Date;
  /** undefined = no email_delivery row: a grant predating delivery tracking. */
  delivery?: EmailShareDelivery;
};

/**
 * What getEmailedAuthorizationsForAlbum actually selects: flat columns, one
 * join hop short of an EmailShare. `deliveryStatus` is the RAW EmailStatus and
 * MUST be revived (withEnumRevival) — un-revived it is a bare string whose
 * `.state` is undefined, which collapses to a null delivery and shows nothing.
 */
export type EmailShareRow = Omit<EmailShare, 'delivery'> & {
  firstName?: string;
  lastName?: string;
  userStatus?: UserStatus;
  deliveryStatus?: EmailStatus;
  deliveryAt?: Date;
};

export interface AuthorizationReadRepository extends RequestScopeLifeCycle {
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
  getEmailedAuthorizationsForAlbum: ({
    albumId,
    viewerId,
  }: {
    albumId: EntityId;
    viewerId: EntityId;
  }) => Promise<EmailShareRow[]>;
  getPublicAuthorizationByAlbum: (args: {
    albumId: EntityId;
    viewerId: EntityId;
  }) => Promise<AuthorizationRow>;
}

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

export interface GrantReadRepository extends RequestScopeLifeCycle {
  hasActiveGrantPermission: (input: HasActiveGrantPermissionInput) => Promise<boolean>;
  hasActiveAccessGrantPermission: (input: HasActiveAccessGrantPermissionInput) => Promise<boolean>;
}

export interface AlbumReadRepository extends RequestScopeLifeCycle {
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

  findAlbumIdsReferencingMediaItem: ({
    mediaItemId,
  }: {
    mediaItemId: string;
  }) => Promise<AlbumIdRow[]>;
  getAlbumForPublicLink: ({
    albumId,
    publicLinkId,
  }: {
    albumId: string;
    publicLinkId: string;
  }) => Promise<AlbumWithCoverRow | undefined>;
}

export type AlbumIdRow = { id: string };

export type AlbumMemberRow = {
  id: string;
  userId: string;
  role: AlbumMemberRole;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface AlbumMemberReadRepository extends RequestScopeLifeCycle {
  getMemberByUserId: ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }) => Promise<AlbumMemberRow | undefined>;
  getAlbumMembersForAlbum: ({
    albumId,
    viewerId,
    collectionInfo,
  }: {
    albumId: string;
    viewerId: string;
    collectionInfo: AlbumMemberCollectionInfo;
  }) => Promise<PagedList<AlbumMemberRow>>;
}

export type ReactionRecord = {
  id: EntityId;
  targetType: EntityType;
  targetId: EntityId;
  userId: EntityId;
  emoji: ReactionEmoji;
} & AuditRecord;

export type DBCommentRow = Omit<CommentRow, 'reactionCounts'> & {
  reactionCounts: DBReactionCounts;
};

export interface CommentReadRepository extends RequestScopeLifeCycle {
  getCommentsForTarget: (args: {
    targetType: EntityType;
    targetId: EntityId;
    collectionInfo: { pageInfo: PageInfo };
  }) => Promise<DBCommentRow[]>;
  getByIdForAuthorization: (args: { commentId: EntityId }) => Promise<DBCommentRow | undefined>;
}

export interface ReactionReadRepository extends RequestScopeLifeCycle {
  countForTarget: (args: { targetType: EntityType; targetId: EntityId }) => Promise<number>;
  viewerReactionsForTargets: (args: {
    viewerId: EntityId;
    targetType: EntityType;
    targetIds: EntityId[];
  }) => Promise<DbReactionRow[]>;
}

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

export type SharedAlbumRow = {
  grantId: EntityId;
  sharedAt: Date;
  sharedBy: EntityId;
  sharedByFirstName: string;
  sharedByLastName: string;
} & AlbumWithCoverRow;

export interface SharedWithMeReadRepository extends RequestScopeLifeCycle {
  getAlbumsSharedWithMe: ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: SharedWithMeAlbumCollectionInfo;
  }) => Promise<PagedList<SharedAlbumRow>>;
  getAlbumSharedWithMe: ({
    viewerId,
    albumId,
  }: {
    viewerId: EntityId;
    albumId: string;
  }) => Promise<SharedAlbumRow | undefined>;
}

export type MediaItemTagRow = {
  mediaItemId: EntityId;
  label: string;
};

export interface MediaItemReadRepository extends RequestScopeLifeCycle {
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
}

export interface UserReadRepository extends RequestScopeLifeCycle {
  getById: (userId: EntityId) => Promise<UserRow | undefined>;
  getByIds: (userIds: EntityId[]) => Promise<UserRow[]>;
  getByEmails: (emails: string[]) => Promise<UserRow[]>;
}

export interface PublicMediaItemReadRepository extends RequestScopeLifeCycle {
  getPublicMediaItem: ({
    mediaItemId,
    publicLinkId,
  }: {
    mediaItemId: EntityId;
    publicLinkId: EntityId;
  }) => Promise<DBPublicMediaItemRow | undefined>;
}

export type PublicAccessRow = {
  id: string;
  albumId: string;
  linkToken: string;
  grantedBy: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type PublicAccessIdRow = { publicAccessId: string };

export interface PublicAccessReadRepository extends RequestScopeLifeCycle {
  getPublicAccessById: (publicAccessId: string) => Promise<PublicAccessRow | undefined>;
}
