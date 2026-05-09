/**
 * AlbumItem: association between an Album and a MediaItem (by ID).
 * createdBy is the user who added the media item; createdAt is when it was added.
 */

import type { ActorId, EntityId } from '../../types/types';
import { Entity, type AuditRecord } from '../Entity';

export type AlbumItemProps = {
  mediaItemId: EntityId;
  orderIndex: bigint;
};

export type AlbumItemRecord = {
  id: EntityId;
  mediaItemId: EntityId;
  /** Stored as string in persistence (DB bigint / JSON-safe). */
  orderIndex: string;
} & AuditRecord;

export class AlbumItem extends Entity<AlbumItemRecord> {
  protected props: AlbumItemProps;

  private constructor(id: EntityId, actorId: ActorId, props: AlbumItemProps) {
    super(id, actorId);
    this.props = props;
  }

  static create(props: { mediaItemId: EntityId; orderIndex: bigint }, actorId: ActorId): AlbumItem {
    return new AlbumItem(crypto.randomUUID(), actorId, {
      mediaItemId: props.mediaItemId,
      orderIndex: props.orderIndex,
    });
  }

  static rehydrate(record: AlbumItemRecord): AlbumItem {
    const item = new AlbumItem(record.id, record.createdBy, {
      mediaItemId: record.mediaItemId,
      orderIndex: BigInt(String(record.orderIndex)),
    });

    item.rehydrateAudit(record);
    return item;
  }

  mediaItemId(): EntityId {
    return this.props.mediaItemId;
  }

  orderIndex(): bigint {
    return this.props.orderIndex;
  }

  setOrderIndex(orderIndex: bigint, actorId: ActorId): void {
    this.props.orderIndex = orderIndex;
    this.touch(actorId);
  }

  hasMediaItem(id: EntityId): boolean {
    return this.props.mediaItemId === id;
  }
}
