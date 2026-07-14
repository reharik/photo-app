import { EntityType, MediaItemStatus, MediaKind, ReactionEmoji } from '@packages/contracts';
import { UploadTarget } from '../../../application/media/MediaStorage';
import { EntityId } from '../../../types/types';

export type FinalizeMediaItemUploadCommand = {
  viewerId: EntityId;
  mediaItemId: EntityId;
};

export type FinalizeMediaItemUploadResult = {
  mediaItemId: string;
  status: MediaItemStatus;
  mimeType?: string;
  size: number;
  kind: MediaKind;
};

export type CreateMediaUploadCommand = {
  viewerId: string;
  kind: MediaKind;
  mimeType: string;
  originalFileName?: string;
  albumId?: EntityId;
};

export type CreateMediaUploadResult = {
  mediaItemId: EntityId;
  status: MediaItemStatus;
  uploadTarget: UploadTarget;
};

export type DeleteMediaItemCommand = {
  viewerId: EntityId;
  mediaItemId: EntityId;
};

export type DeleteMediaItemResult = {
  mediaItemId: EntityId;
};

export type DeleteMediaItemsCommand = {
  viewerId: EntityId;
  mediaItemIds: EntityId[];
};

export type DeleteMediaItemsResult = {
  deletedMediaItemIds: EntityId[];
};

export type UpdateMediaItemDetailsCommand = {
  viewerId: EntityId;
  mediaItemId: EntityId;
  title?: string | null;
  description?: string | null;
  /** ISO string or Date (transport may pass either). */
  takenAt?: Date | string | null;
};

export type UpdateMediaItemDetailsResult = {
  mediaItemId: EntityId;
  title?: string;
  description?: string;
  takenAt?: Date;
};

export type MediaItemTag = {
  id?: string;
  mediaItemId: EntityId;
  userTagId: EntityId;
  label: string;
  createdBy: EntityId;
  createdAt: Date;
  updatedBy: EntityId;
  updatedAt: Date;
};

export type MediaItemTagInput = Omit<MediaItemTag, 'userTagId'> & {
  userTagId?: EntityId;
};

export type UpdateMediaItemTagsCommand = {
  viewerId: EntityId;
  mediaItemId: EntityId;
  tags: { userTagId?: EntityId; label: string }[];
};

export type UpdateMediaItemTagsResult = {
  mediaItemId: EntityId;
};

export type Reaction = {
  id?: string;
  targetId: EntityId;
  targetType: EntityType;
  userId: EntityId;
  firstName?: string;
  lastName?: string;
  emoji: ReactionEmoji;
  createdBy: EntityId;
  createdAt: Date;
  updatedBy: EntityId;
  updatedAt: Date;
};

export type MediaItemReactionInput = Omit<Reaction, 'userId'> & {
  userId?: EntityId;
};

export type UpdateMediaItemReactionsCommand = {
  viewerId: EntityId;
  mediaItemId: EntityId;
  tags: MediaItemReactionInput[];
};

export type UpdateMediaItemReactionsResult = {
  mediaItemId: EntityId;
};
