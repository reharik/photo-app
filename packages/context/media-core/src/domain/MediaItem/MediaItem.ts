/**
 * MediaItem: uploaded media asset (photo or video) owned by a user (by ID).
 * Encapsulates metadata; can appear in multiple albums via AlbumItem.
 */

import type { MediaAssetKind, ResourceTypeEnum, SharePermission } from '@packages/contracts';
import {
  AppErrorCollection,
  ContractError,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
} from '@packages/contracts';
import type { ActorId, EntityId, WriteResult } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import { Authorization, AuthorizationRecord } from '../Authorization/Authorization';
import { grantAuthorizationValidation } from '../Authorization/grantAuthorizationValidation';
import { Comment, CommentRecord } from '../Comment/Comment';
import type { AuditRecord, ChildEntities } from '../Entity';
import { fail, ok } from '../utilities/writeResponse';
import { MediaAsset, MediaAssetRecord } from './MediaAsset';
import { normalizeMediaItemTagLabels } from './MediaItemTag';

interface AssetMetadata {
  kind: MediaAssetKind;
  mimeType?: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export type MediaItemProps = {
  ownerId: EntityId;
  kind: MediaKind;
  status: MediaItemStatus;
  mimeType: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  originalFileName?: string;
  title?: string | null;
  description?: string | null;
  takenAt?: Date | null;
};

export type MediaItemRecord = {
  id: EntityId;
  ownerId: EntityId;
  kind: MediaKind;
  status: MediaItemStatus;
  mimeType: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  originalFileName?: string;
  title?: string;
  description?: string;
  takenAt?: Date;
  comments: CommentRecord[];
  assets: MediaAssetRecord[];
  /** Normalized display labels (mapped to `user_tag` + `media_item_tag` in persistence). */
  tags: string[];
  authorizations: AuthorizationRecord[];
} & AuditRecord;

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
  #tags: string[] = [];
  #authorizations: Authorization[] = [];

  private constructor(id: EntityId, actorId: ActorId, props: MediaItemProps) {
    super(id, actorId);
    this.props = {
      ...props,
    };
    this.props.ownerId = actorId;
  }

  static create(input: CreateMediaItemInput, actorId: ActorId): MediaItem {
    const mediaItemId = crypto.randomUUID();
    return new MediaItem(mediaItemId, actorId, {
      ...input,
      sizeBytes: input.sizeBytes ?? 0,
      status: MediaItemStatus.pending,
      ownerId: actorId,
    });
  }

  static rehydrate(record: MediaItemRecord): MediaItem {
    const mediaItem = new MediaItem(record.id, record.createdBy, record);

    mediaItem.rehydrateAudit(record);
    mediaItem.#comments = record.comments.map((r) => Comment.rehydrate(r));
    mediaItem.#assets = record.assets.map((r) => MediaAsset.rehydrate(r));
    mediaItem.#authorizations = record.authorizations.map((r) => Authorization.rehydrate(r));
    mediaItem.#tags = [...(record.tags ?? [])];

    return mediaItem;
  }

  addComment(
    props: {
      resourceType: ResourceTypeEnum;
      authorId: EntityId;
      content: string;
    },
    actorId: ActorId,
  ): void {
    this.#comments.push(Comment.create(props, actorId));
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

  replaceTags(rawLabels: string[], actorId: ActorId): WriteResult {
    const normalized = normalizeMediaItemTagLabels(rawLabels);
    if (normalized === null) {
      return fail(ContractError.InvalidMediaItemTags);
    }
    this.#tags = [...normalized.labels];
    this.touch(actorId);
    return ok(undefined);
  }

  tags(): readonly string[] {
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
    permission: SharePermission,
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
          permission,
          grantedToUser: grantedToUserId,
          publicLinkId: undefined,
          grantedBy: actorId,
          label,
          expiresAt,
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

  public override persistenceState(): Record<string, unknown> {
    return {
      ...super.persistenceState(),
      tags: this.#tags,
      authorizations: this.#authorizations,
      comments: this.#comments,
      assets: this.#assets,
    };
  }

  protected childEntities(): ChildEntities {
    return {
      comments: this.#comments,
      assets: this.#assets,
      authorizations: this.#authorizations,
    };
  }
}
