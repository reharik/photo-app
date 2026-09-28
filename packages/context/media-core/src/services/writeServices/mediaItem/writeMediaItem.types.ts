import {
  EntityId,
  EntityType,
  MediaItemStatus,
  MediaKind,
  OperationResult,
  ReactionEmoji,
} from '@packages/contracts';
import { UploadTarget } from '../../../application/media/MediaStorage';

export type FinalizeMediaItemUploadCommand = {
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
  clientId: string;
  kind: MediaKind;
  mimeType: string;
  originalFileName?: string;
  albumId?: EntityId;
  size: number;
};

export type CreateMediaUploadResult = {
  mediaItemId: EntityId;
  status: MediaItemStatus;
  uploadTarget: UploadTarget;
};

/**
 * One entry per input command, in input order. `clientId` sits outside the result because a
 * `Failure` has nowhere to put it: an item the server refused still has to be attributable to
 * the file the client sent, and stuffing it into the failure's `context` would make the
 * transport dig an identifier out of a bag meant for display data.
 */
export type CreateMediaUploadItemOutcome = {
  clientId: string;
  result: OperationResult<CreateMediaUploadResult>;
};

export type DeleteMediaItemCommand = {
  mediaItemId: EntityId;
};

export type DeleteMediaItemResult = {
  mediaItemId: EntityId;
};

export type DeleteMediaItemsCommand = {
  mediaItemIds: EntityId[];
};

export type DeleteMediaItemsResult = {
  deletedMediaItemIds: EntityId[];
};

export type UpdateMediaItemDetailsCommand = {
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

export type UpdateMediaItemReactionsResult = {
  mediaItemId: EntityId;
};
