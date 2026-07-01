/**
 * MediaItem: uploaded media asset (photo or video) owned by a user (by ID).
 * Encapsulates metadata; can appear in multiple albums via AlbumItem.
 */

import type { MediaAssetKind, Operation } from '@packages/contracts';
import {
  AppErrorCollection,
  ContractError,
  EntityType,
  fail,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
  ok,
  WriteResult,
} from '@packages/contracts';
import { groupByMapping } from '@packages/infrastructure';
import { DBReactionCounts } from '../../services/readServices/types';
import {
  MediaItemTag,
  Reaction,
} from '../../services/writeServices/mediaItem/writeMediaItem.types';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import { Authorization, AuthorizationRecord } from '../Authorization/Authorization';
import { grantAuthorizationValidation } from '../Authorization/grantAuthorizationValidation';
import type { AuditRecord, ChildEntities, VOCollection } from '../Entity';
import { MediaAsset, MediaAssetRecord } from './MediaAsset';

interface AssetMetadata {
  kind: MediaAssetKind;
  mimeType?: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}
type ApplyCaptureTimeResult =
  | { kind: 'applied'; takenAtUtc: Date; offsetMinutes: number | undefined }
  | { kind: 'skipped'; reason: 'no-exif-date' | 'already-set' };

export type MediaItemTagRecord = Omit<MediaItemTag, 'id'> & {
  id: string;
};

export type MediaItemReactionRecord = Omit<Reaction, 'id'> & {
  id: string;
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
  takenAtUtcOffsetMinutes?: number | null;
  reactionCounts?: DBReactionCounts;
};

export type MediaItemRecord = MediaItemProps & {
  id: EntityId;
} & AuditRecord;

export type MediaItemChildRecords = {
  assets: MediaAssetRecord[];
  tags: MediaItemTagRecord[];
  authorizations: AuthorizationRecord[];
  reactions: MediaItemReactionRecord[];
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
  #assets: MediaAsset[] = [];
  #authorizations: Authorization[] = [];
  #removedAssets: MediaAsset[] = [];
  #removedAuthorizations: Authorization[] = [];
  #tags: MediaItemTag[] = [];
  #removedTags: { mediaItemId: EntityId; userTagId: EntityId }[] = [];
  #addedTags: Omit<MediaItemTag, 'label'>[] = [];
  #reactions: Reaction[] = [];
  #addedReactions: Reaction[] = [];
  #removedReactions: { targetId: EntityId; targetType: string; userId: EntityId; emoji: string }[] =
    [];

  #computedReactionCounts(): void {
    const byEmoji = groupByMapping(
      this.#reactions,
      (r) => r.emoji,
      (r) => ({ userId: r.userId, firstName: r.firstName, lastName: r.lastName }),
    );

    this.props.reactionCounts = {
      total: this.#reactions.length,
      byEmoji: Array.from(byEmoji, ([emoji, reactors]) => ({
        emoji: emoji.value,
        count: reactors.length,
        reactors,
      })),
    };
  }

  private constructor(actorId: ActorId, props: MediaItemProps, id?: EntityId) {
    super(id, actorId, 'media_item');
    this.props = {
      ...props,
    };
    this.props.ownerId = actorId;
    this.#computedReactionCounts();
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
    mediaItem.#assets = childRecords.assets.map((r) => MediaAsset.rehydrate(r));
    mediaItem.#authorizations = childRecords.authorizations.map((r) => Authorization.rehydrate(r));
    mediaItem.#tags = [...(childRecords.tags ?? [])];
    mediaItem.#reactions = [...(childRecords.reactions ?? [])];
    mediaItem.#computedReactionCounts();
    return mediaItem;
  }

  addAsset(kind: MediaAssetKind, mimeType: string) {
    if (this.#assets.find((a) => a.kind().equals(kind))) {
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
    const asset = this.#assets.find((a) => a.kind().equals(kind));
    if (!asset) {
      return fail(AppErrorCollection.mediaItem.AssetNotFound);
    }
    if (!asset.status().equals(MediaAssetStatus.pending)) {
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

  applyExifCaptureTime(input: {
    takenAtUtc?: Date;
    takenAtUtcOffsetMinutes?: number;
  }): ApplyCaptureTimeResult {
    if (input.takenAtUtc == null) {
      return { kind: 'skipped', reason: 'no-exif-date' };
    }
    if (this.props.takenAt != null) {
      return { kind: 'skipped', reason: 'already-set' };
    }
    this.props.takenAt = input.takenAtUtc;
    this.props.takenAtUtcOffsetMinutes = input.takenAtUtcOffsetMinutes;
    return {
      kind: 'applied',
      takenAtUtc: input.takenAtUtc,
      offsetMinutes: input.takenAtUtcOffsetMinutes,
    };
  }

  getAuthorizations(): Authorization[] {
    return this.#authorizations;
  }
  grantAuthorization(
    operations: Operation[],
    actorId: ActorId,
    grantedToUserId: EntityId,
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
    if (!this.props.status.equals(MediaItemStatus.pending)) {
      return fail(AppErrorCollection.mediaItem.StatusNotPending);
    }
    this.props.sizeBytes = input.sizeBytes;
    if (input.mimeType !== undefined && input.mimeType.length > 0) {
      this.props.mimeType = input.mimeType;
    }
    if (kind.equals(MediaKind.photo)) {
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
    if (!this.props.status.equals(MediaItemStatus.processing)) {
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

  toggleReaction(item: Reaction, actorId: ActorId): WriteResult {
    const reaction = this.#reactions.find(
      (r) => r.emoji.equals(item.emoji) && r.userId === item.userId,
    );
    if (reaction) {
      this.#removedReactions.push({
        targetId: this.id(),
        targetType: EntityType.mediaItem.value,
        userId: item.userId,
        emoji: item.emoji.value,
      });
      this.#reactions = this.#reactions.filter((r) => r.id !== reaction.id);
    } else {
      const newReaction = {
        ...item,
        id: crypto.randomUUID(),
        targetId: this.id(),
        targetType: EntityType.mediaItem,
        updatedBy: actorId,
        updatedAt: new Date(),
      };
      this.#addedReactions.push(newReaction);
      this.#reactions.push(newReaction);
    }
    this.#computedReactionCounts();
    this.touch(actorId);
    return ok(undefined);
  }

  childEntities(): ChildEntities {
    return {
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
      reactions: {
        upsert: this.#addedReactions,
        removed: this.#removedReactions,
        conflictKeys: ['targetId', 'targetType', 'userId', 'emoji'],
        tableName: 'reaction',
      },
    };
  }
}
