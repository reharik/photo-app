/**
 * MediaItem: uploaded media asset (photo or video) owned by a user (by ID).
 * Encapsulates metadata; can appear in multiple albums via AlbumItem.
 */

import type { MediaAssetKind, Operation } from '@packages/contracts';
import {
  AppErrorCollection,
  CommentTargetType,
  ContractError,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
} from '@packages/contracts';
import { MediaItemTag } from '../../services/writeServices/mediaItem/writeMediaItem.types';
import type { ActorId, EntityId, WriteResult } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import { Authorization, AuthorizationRecord } from '../Authorization/Authorization';
import { grantAuthorizationValidation } from '../Authorization/grantAuthorizationValidation';
import { Comment, CommentRecord } from '../Comment/Comment';
import type { AuditRecord, ChildEntities, VOCollection } from '../Entity';
import { fail, ok } from '../utilities/writeResponse';
import { MediaAsset, MediaAssetRecord } from './MediaAsset';
interface AssetMetadata {
  kind: MediaAssetKind;
  mimeType?: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export type MediaItemTagRecord = {
  id: string;
  mediaItemId: EntityId;
  userTagId: EntityId;
  label: string;
  createdBy: EntityId;
  createdAt: Date;
  updatedBy: EntityId;
  updatedAt: Date;
};

export type MediaItemProps = Omit<
  CreateMediaItemInput,
  'status' | 'title' | 'description' | 'takenAt'
> & {
  ownerId: EntityId;
  status: MediaItemStatus;
  title?: string | null;
  description?: string | null;
  takenAt?: Date | null;
};

export type MediaItemRecord = MediaItemProps & {
  id: EntityId;
} & AuditRecord;

export type MediaItemChildRecords = {
  comments: CommentRecord[];
  assets: MediaAssetRecord[];
  tags: MediaItemTagRecord[];
  authorizations: AuthorizationRecord[];
};

export type CreateMediaItemInput = {
  kind: MediaKind;
  status?: MediaItemStatus;
  mimeType: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  originalFileName?: string;
  title?: string;
  description?: string;
  takenAt?: Date;
};

export class MediaItem extends AggregateRoot<MediaItemRecord> {
  protected props: MediaItemProps;
  #comments: Comment[] = [];
  #assets: MediaAsset[] = [];
  #authorizations: Authorization[] = [];
  #removedComments: Comment[] = [];
  #removedAssets: MediaAsset[] = [];
  #removedAuthorizations: Authorization[] = [];
  #tags: MediaItemTag[] = [];
  #removedTags: { mediaItemId: EntityId; userTagId: EntityId }[] = [];
  #addedTags: Omit<MediaItemTag, 'label'>[] = [];

  private constructor(actorId: ActorId, props: MediaItemProps, id?: EntityId) {
    super(id, actorId, 'media_item');
    this.props = {
      ...props,
    };
    this.props.ownerId = actorId;
  }

  static create(input: CreateMediaItemInput, actorId: ActorId): MediaItem {
    return new MediaItem(actorId, {
      ...input,
      sizeBytes: input.sizeBytes ?? 0,
      status: MediaItemStatus.pending,
      ownerId: actorId,
    });
  }

  static rehydrate(record: MediaItemRecord, childRecords: MediaItemChildRecords): MediaItem {
    const mediaItem = new MediaItem(record.createdBy, record, record.id);

    mediaItem.rehydrateAudit(record);
    mediaItem.#comments = childRecords.comments.map((r) => Comment.rehydrate(r));
    mediaItem.#assets = childRecords.assets.map((r) => MediaAsset.rehydrate(r));
    mediaItem.#authorizations = childRecords.authorizations.map((r) => Authorization.rehydrate(r));
    mediaItem.#tags = [...(childRecords.tags ?? [])];
    return mediaItem;
  }

  addComment(
    props: {
      authorId: EntityId;
      body: string;
      displayName: string;
      displayAvatarUrl?: string;
      parentCommentId?: EntityId;
    },
    actorId: ActorId,
  ): void {
    this.#comments.push(
      Comment.create(
        {
          targetType: CommentTargetType.mediaItem,
          targetId: this.id(),
          authorId: props.authorId,
          body: props.body,
          displayName: props.displayName,
          displayAvatarUrl: props.displayAvatarUrl,
          parentCommentId: props.parentCommentId,
        },
        actorId,
      ),
    );
    this.touch(actorId);
  }

  addAsset(kind: MediaAssetKind, mimeType: string) {
    if (this.#assets.find((a) => a.kind() === kind)) {
      return fail(AppErrorCollection.mediaItem.AssetKindAlreadyExists);
    }

    this.#assets.push(
      MediaAsset.create(
        {
          kind,
          mimeType,
          mediaItemId: this.id(),
        },
        this.props.ownerId,
      ),
    );
    return ok(undefined);
  }

  updateAssetWithMetadata({ kind, sizeBytes, mimeType, width, height }: AssetMetadata) {
    const asset = this.#assets.find((a) => a.kind() === kind);
    if (!asset) {
      return fail(AppErrorCollection.mediaItem.AssetNotFound);
    }
    if (asset.status() !== MediaAssetStatus.pending) {
      return fail(AppErrorCollection.mediaItem.AssetNotPending);
    }
    asset.applyUploadedObjectMetadata({ sizeBytes, mimeType, width, height }, this.props.ownerId);
    return ok(undefined);
  }

  addTags(tags: MediaItemTag[]): WriteResult {
    const newTags = tags.map((tag) => ({
      ...tag,
      id: crypto.randomUUID(),
    }));

    this.#tags = [...this.#tags, ...newTags];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.#addedTags = [...this.#addedTags, ...newTags.map(({ label, ...rest }) => rest)];
    return ok(undefined);
  }

  removeTags(tagIds: { mediaItemId: EntityId; userTagId: EntityId }[]): WriteResult {
    this.#tags = this.#tags.filter(
      (t) => !tagIds.some((removeTag) => removeTag.userTagId === t.userTagId),
    );
    this.#removedTags = [...this.#removedTags, ...tagIds];
    return ok(undefined);
  }

  tags(): readonly MediaItemTag[] {
    return this.#tags;
  }

  updateItemDetails(
    {
      title,
      description,
      takenAt,
    }: { title?: string | null; description?: string | null; takenAt?: Date | null },
    actorId: ActorId,
  ): WriteResult {
    this.props.title = title;
    this.props.description = description;
    this.props.takenAt = takenAt;
    this.touch(actorId);
    return ok(undefined);
  }

  title(): string | undefined {
    return this.props.title ?? undefined;
  }

  description(): string | undefined {
    return this.props.description ?? undefined;
  }

  takenAt(): Date | undefined {
    return this.props.takenAt ?? undefined;
  }

  ownerId(): EntityId {
    return this.props.ownerId;
  }

  status(): MediaItemStatus {
    return this.props.status;
  }

  kind(): MediaKind {
    return this.props.kind;
  }

  mimeType(): string {
    return this.props.mimeType;
  }

  sizeBytes(): number {
    return this.props.sizeBytes ?? 0;
  }

  width(): number | undefined {
    return this.props.width;
  }

  height(): number | undefined {
    return this.props.height;
  }

  getAuthorizations(): Authorization[] {
    return this.#authorizations;
  }
  grantAuthorization(
    operations: Operation[],
    actorId: ActorId,
    grantedToUserId?: EntityId,
    label?: string,
    expiresAt?: Date,
  ): WriteResult<{
    authorization: Authorization;
  }> {
    const result = grantAuthorizationValidation(this, grantedToUserId, undefined, label, expiresAt);
    if (!result.success) {
      return result;
    }
    // Maybe this should not be an upsert, we'll see.

    const existingAuthorization = this.#authorizations.find(
      (s) => s.grantedToUser() === grantedToUserId,
    );
    if (!existingAuthorization) {
      const authorization = Authorization.create(
        {
          operations,
          grantedToUser: grantedToUserId,
          publicLinkId: undefined,
          grantedBy: actorId,
          label,
          expiresAt,
          mediaItemId: this.id(),
        },
        actorId,
      );
      this.#authorizations.push(authorization);
      this.touch(actorId);
      return ok({ authorization });
    }

    if (expiresAt && result.value.status === 'updateExpireDate') {
      const updatedExpireDate = existingAuthorization.updateExpireDate(expiresAt, actorId);
      if (!updatedExpireDate.success) {
        return updatedExpireDate;
      }
      this.touch(actorId);
      return ok({ authorization: existingAuthorization });
    }

    if (label && result.value.status === 'updateLabel') {
      const updatedLabel = existingAuthorization.updateLabel(label, actorId);
      if (!updatedLabel.success) {
        return updatedLabel;
      }
      this.touch(actorId);
      return ok({ authorization: existingAuthorization });
    }

    return fail(AppErrorCollection.album.NoActionProvidedOnAuthorizationCommand);
  }
  revokeAuthorization(authorizationId: EntityId, actorId: ActorId): WriteResult {
    const authorization = this.#authorizations.find((s) => s.id() === authorizationId);
    if (!authorization) {
      return fail(AppErrorCollection.authorization.AuthorizationNotFound);
    }
    const result = authorization.revokeAuthorization(actorId);
    if (!result.success) {
      return result;
    }
    this.touch(actorId);
    return ok(undefined);
  }
  /**
   * After the original object exists in storage: persist size (and optional mime).
   * - Photo: pending → PROCESSING (awaiting display/thumbnail derivatives in storage).
   * - Video: pending → READY (no derivative pipeline; UI uses placeholders for thumbnails until a poster pipeline exists).
   */
  completeUploadedWithMetadata(
    input: { sizeBytes: number; mimeType?: string },
    kind: MediaKind,
    actorId: ActorId,
  ): WriteResult {
    if (this.props.status !== MediaItemStatus.pending) {
      return fail(AppErrorCollection.mediaItem.StatusNotPending);
    }
    this.props.sizeBytes = input.sizeBytes;
    if (input.mimeType !== undefined && input.mimeType.length > 0) {
      this.props.mimeType = input.mimeType;
    }
    if (kind === MediaKind.photo) {
      this.props.status = MediaItemStatus.processing;
    } else {
      this.props.status = MediaItemStatus.ready;
    }
    this.touch(actorId);
    return ok(undefined);
  }

  /**
   * After display (and thumbnail) derivatives exist in storage: processing (or legacy uploaded) → ready.
   * Item-level width/height reflect the display derivative dimensions.
   */
  markReadyAfterDerivatives(
    input: { displayWidth: number; displayHeight: number },
    actorId: ActorId,
  ): WriteResult {
    if (this.props.status !== MediaItemStatus.processing) {
      return fail(AppErrorCollection.mediaItem.StatusNotUploaded);
    }
    const w = Math.round(input.displayWidth);
    const h = Math.round(input.displayHeight);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      return fail(ContractError.InvalidMediaDimensions);
    }
    this.props.width = w;
    this.props.height = h;
    this.props.status = MediaItemStatus.ready;
    this.touch(actorId);
    return ok(undefined);
  }

  childEntities(): ChildEntities {
    return {
      comments: { upsert: this.#comments, removed: this.#removedComments },
      assets: { upsert: this.#assets, removed: this.#removedAssets },
      authorizations: { upsert: this.#authorizations, removed: this.#removedAuthorizations },
    };
  }

  VOs(): Record<string, VOCollection> {
    return {
      tags: {
        upsert: this.#addedTags,
        removed: this.#removedTags,
        conflictKeys: ['mediaItemId', 'userTagId'],
        tableName: 'media_item_tag',
      },
    };
  }
}
