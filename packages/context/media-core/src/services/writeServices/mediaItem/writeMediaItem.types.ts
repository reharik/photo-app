import { MediaItemStatus, MediaKind, SharePermission } from '@packages/contracts';
import { UploadTarget } from '../../../application/media/MediaStorage';
import { EntityId } from '../../../types/types';
import { AuthorizationProjection } from '../../readServices/types';

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

export type UpdateMediaItemTagsCommand = {
  viewerId: EntityId;
  mediaItemId: EntityId;
  tags: string[];
};

export type UpdateMediaItemTagsResult = {
  mediaItemId: EntityId;
  tags: string[];
};

export type GrantUserAuthorizationResult = {
  authorizationIds: EntityId[];
  authorizations: AuthorizationProjection[];
};

export type GrantUserAuthorizationForMediaItemsCommand = {
  viewerId: EntityId;
  mediaItemIds: EntityId[];
  permission: SharePermission;
  grantedToUserId?: EntityId;
  grantedToHandle?: string;
  label?: string;
  expiresAt?: Date;
};
