/**
 * MediaItem: uploaded media asset (photo or video) owned by a user (by ID).
 * Encapsulates metadata; can appear in multiple albums via AlbumItem.
 */

import {
  AppErrorCollection,
  ContractError,
  fail,
  MediaAssetKind,
  MediaItemStatus,
  MediaKind,
  ok,
  OperationResult,
} from '@packages/contracts';

import type { ActorId, AuditRecord, ChildEntities, EntityId } from '@packages/contracts';
import { AggregateRoot } from '../AggregateRoot';
import { MediaAsset, MediaAssetRecord } from './MediaAsset';

interface AssetMetadata {
  kind: MediaAssetKind;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export type MediaItemProps = Omit<CreateMediaItemInput, 'status' | 'takenAt'> & {
  ownerId: EntityId;
  status: MediaItemStatus;
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
  width?: number;
  height?: number;
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

  applyProcessingResults(
    result: {
      capture: { takenAtUtc?: Date; takenAtUtcOffsetMinutes?: number };
      displayAsset: AssetMetadata;
      thumbnailAsset: AssetMetadata;
      originalAsset: AssetMetadata;
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

    if (this.#assets.length > 0) {
      return fail(AppErrorCollection.mediaItem.AssetKindAlreadyExists);
    }

    const original = MediaAsset.create(
      {
        kind: MediaAssetKind.original,
        mimeType: originalAsset.mimeType,
        mediaItemId: this.id(),
      },
      actorId,
    );

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
    original.applyUploadedObjectMetadata(originalAsset, actorId);
    this.#assets.push(thumb, display, original);

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
