/**
 * MediaAsset: a stored file (source or derivative) for a MediaItem.
 */

import { MediaAssetKind, MediaAssetStatus } from '@packages/contracts';
import type { ActorId, EntityId } from '../../types/types';
import { Entity, type AuditRecord } from '../Entity';

export type MediaAssetProps = {
  mediaItemId: EntityId;
  kind: MediaAssetKind;
  mimeType: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  status: MediaAssetStatus;
};

export type MediaAssetRecord = {
  id: EntityId;
  mediaItemId: EntityId;
  kind: MediaAssetKind;
  mimeType: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  status: MediaAssetStatus;
} & AuditRecord;

export type CreateMediaAssetInput = {
  mediaItemId: EntityId;
  kind: MediaAssetKind;
  mimeType: string;
};

export class MediaAsset extends Entity<MediaAssetRecord> {
  protected props: MediaAssetProps;

  private constructor(actorId: ActorId, props: MediaAssetProps, id?: EntityId) {
    super(id, actorId, 'media_asset');
    this.props = props;
  }

  static create(input: CreateMediaAssetInput, actorId: ActorId): MediaAsset {
    return new MediaAsset(actorId, {
      kind: input.kind,
      mimeType: input.mimeType,
      status: MediaAssetStatus.pending,
      mediaItemId: input.mediaItemId,
    });
  }

  static rehydrate(record: MediaAssetRecord): MediaAsset {
    const asset = new MediaAsset(
      record.createdBy,
      {
        mediaItemId: record.mediaItemId,
        kind: record.kind,
        mimeType: record.mimeType,
        width: record.width,
        height: record.height,
        fileSizeBytes: record.fileSizeBytes,
        status: record.status,
      },
      record.id,
    );
    asset.rehydrateAudit(record);
    return asset;
  }

  status(): MediaAssetStatus {
    return this.props.status;
  }

  kind(): MediaAssetKind {
    return this.props.kind;
  }

  mimeType(): string {
    return this.props.mimeType;
  }

  applyUploadedObjectMetadata(
    input: { sizeBytes: number; mimeType?: string; width?: number; height?: number },
    actorId: ActorId,
  ): void {
    this.props.fileSizeBytes = input.sizeBytes;
    if (input.mimeType !== undefined && input.mimeType.length > 0) {
      this.props.mimeType = input.mimeType;
    }
    if (input.width !== undefined) {
      this.props.width = input.width;
    }
    if (input.height !== undefined) {
      this.props.height = input.height;
    }
    this.props.status = MediaAssetStatus.ready;
    this.touch(actorId);
  }
}
