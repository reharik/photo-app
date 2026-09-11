/**
 * Notification: user-facing event record for shares, comments, added media, etc.
 * Aggregate Root with its own lifecycle; references recipient (and optional resource) by ID only.
 */

import type { ActorId, AuditRecord, EntityId } from '@packages/contracts';
import { NotificationKind } from '@packages/contracts';
import { AggregateRoot } from '../AggregateRoot';

export type NotificationProps = {
  recipientId: EntityId;
  kind: NotificationKind;
  title: string;
  body: string;
  readAt?: Date;
};

export type NotificationRecord = {
  id: EntityId;
  recipientId: EntityId;
  kind: NotificationKind;
  title: string;
  body: string;
  readAt?: Date;
} & AuditRecord;

export type CreateNotificationInput = {
  recipientId: EntityId;
  kind: NotificationKind;
  title: string;
  body: string;
};

export class Notification extends AggregateRoot<NotificationRecord> {
  protected props: NotificationProps;

  private constructor(actorId: ActorId, props: NotificationProps, id?: EntityId) {
    super(id, actorId, 'notification');
    this.props = props;
  }

  static create(input: CreateNotificationInput, actorId: ActorId): Notification {
    return new Notification(actorId, input);
  }

  static rehydrate(record: NotificationRecord): Notification {
    const notification = new Notification(record.createdBy, record, record.id);

    notification.rehydrateAudit(record);
    return notification;
  }

  markAsRead(actorId: ActorId): void {
    this.props.readAt = new Date();
    this.touch(actorId);
  }
}
