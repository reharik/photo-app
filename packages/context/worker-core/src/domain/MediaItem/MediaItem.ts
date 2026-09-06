/**
 * MediaItem: uploaded media asset (photo or video) owned by a user (by ID).
 * Encapsulates metadata; can appear in multiple albums via AlbumItem.
 */

import {
  AppErrorCollection,
  ContractError,
  fail,
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
  ok,
  OperationResult,
} from '@packages/contracts';

import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import type { AuditRecord, ChildEntities } from '../Entity';
import { MediaAsset, MediaAssetRecord } from './MediaAsset';

interface AssetMetadata {
  kind: MediaAssetKind;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

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
};

export type MediaItemRecord = MediaItemProps & {
  id: EntityId;
} & AuditRecord;

export type MediaItemChildRecords = {
  assets: MediaAssetRecord[];
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
  #removedAssets: MediaAsset[] = [];

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
    mediaItem.#assets = childRecords.assets.map((r) => MediaAsset.rehydrate(r));

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

  updateItemDetails(
    {
      title,
      description,
      takenAt,
    }: { title?: string | null; description?: string | null; takenAt?: Date | null },
    actorId: ActorId,
  ): OperationResult {
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

  applyProcessingResults(
    result: {
      capture: { takenAtUtc?: Date; takenAtUtcOffsetMinutes?: number };
      displayAsset: AssetMetadata;
      thumbnailAsset: AssetMetadata;
      originalAsset?: AssetMetadata;
    },
    actorId: EntityId,
  ) {
    const { capture, displayAsset, thumbnailAsset, originalAsset } = result;
    if (!this.props.status.equals(MediaItemStatus.processing)) {
      return fail(AppErrorCollection.mediaItem.MediaItemNotProcessing);
    }
    const w = Math.round(displayAsset.width || 0);
    const h = Math.round(displayAsset.height || 0);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      return fail(ContractError.InvalidMediaDimensions);
    }

    if (
      this.#assets.find(
        (a) => a.kind().equals(MediaAssetKind.thumbnail) || a.kind().equals(MediaAssetKind.display),
      )
    ) {
      return fail(AppErrorCollection.mediaItem.AssetKindAlreadyExists);
    }

    if (originalAsset) {
      const original = this.#assets.find((a) => a.kind().equals(MediaAssetKind.original));
      if (!original) {
        return fail(AppErrorCollection.mediaItem.AssetNotFound);
      }
      if (!original.status().equals(MediaAssetStatus.processing)) {
        return fail(AppErrorCollection.mediaItem.AssetNotProcessing);
      }
      // Mutating inside the Guard, not great but ok since this is the last
      // guard. If you feel like moving things around you'll have to pull this
      // back out.
      original.applyUploadedObjectMetadata(originalAsset, actorId);
    }

    const thumb = MediaAsset.create(
      {
        kind: MediaAssetKind.thumbnail,
        mimeType: thumbnailAsset.mimeType,
        mediaItemId: this.id(),
      },
      actorId,
    );

    const display = MediaAsset.create(
      {
        kind: MediaAssetKind.display,
        mimeType: displayAsset.mimeType,
        mediaItemId: this.id(),
      },
      actorId,
    );
    thumb.applyUploadedObjectMetadata(thumbnailAsset, actorId);
    display.applyUploadedObjectMetadata(displayAsset, actorId);
    this.#assets.push(thumb, display);

    if (capture.takenAtUtc != null && this.props.takenAt == null) {
      this.props.takenAt = capture.takenAtUtc;
      this.props.takenAtUtcOffsetMinutes = capture.takenAtUtcOffsetMinutes;
    }

    this.props.width = w;
    this.props.height = h;
    this.props.status = MediaItemStatus.ready;
    this.touch(actorId);
    return ok(undefined);
  }

  /**
   * After the original object exists in storage: persist size (and optional mime).  /**
   * After the original object exists in storage: persist size (and optional mime).
   * - Photo: pending → PROCESSING (awaiting display/thumbnail derivatives in storage).
   * - Video: pending → READY (no derivative pipeline; UI uses placeholders for thumbnails until a poster pipeline exists).
   */
  completeUploadedWithMetadata(
    input: { sizeBytes: number; mimeType?: string },
    kind: MediaKind,
    actorId: ActorId,
  ): OperationResult {
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

  // /**
  //  * After display (and thumbnail) derivatives exist in storage: processing (or legacy uploaded) → ready.
  //  * Item-level width/height reflect the display derivative dimensions.
  //  */
  // markReadyAfterDerivatives(
  //   input: { displayWidth: number; displayHeight: number },
  //   actorId: ActorId,
  // ): OperationResult {
  //   if (!this.props.status.equals(MediaItemStatus.processing)) {
  //     return fail(AppErrorCollection.mediaItem.StatusNotUploaded);
  //   }
  //   const w = Math.round(input.displayWidth);
  //   const h = Math.round(input.displayHeight);
  //   if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
  //     return fail(ContractError.InvalidMediaDimensions);
  //   }
  //   this.props.width = w;
  //   this.props.height = h;
  //   this.props.status = MediaItemStatus.ready;
  //   this.touch(actorId);
  //   return ok(undefined);
  // }

  /**
   * Terminal outcome of the derivative pipeline: processing → failed. Without this the
   * item sits at PROCESSING forever after a dead job and the upload UI polls until it
   * times out. Idempotent, and a no-op for any other status (a concurrently-readied or
   * deleted item must not be dragged back to failed).
   */
  markProcessingFailed(actorId: ActorId): OperationResult {
    if (this.props.status.equals(MediaItemStatus.failed)) {
      return ok(undefined);
    }
    if (!this.props.status.equals(MediaItemStatus.processing)) {
      return fail(AppErrorCollection.mediaItem.StatusNotUploaded);
    }
    this.props.status = MediaItemStatus.failed;
    this.touch(actorId);
    return ok(undefined);
  }

  childEntities(): ChildEntities {
    return {
      assets: { upsert: this.#assets, removed: this.#removedAssets },
    };
  }
}
