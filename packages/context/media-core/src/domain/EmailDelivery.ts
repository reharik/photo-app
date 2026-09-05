import { EmailKind, EmailStatus } from '@packages/contracts';
import { ActorId, EntityId } from '../types';
import { AggregateRoot } from './AggregateRoot';
import { AuditRecord } from './Entity';

export type EmailDeliveryRecord = EmailDeliveryProps & {
  id: EntityId;
} & AuditRecord;

export type EmailDeliveryProps = {
  sesMessageId: string;
  accessGrantId?: string;
  emailKind: EmailKind;
  recipientEmail: string;
  status: EmailStatus;
  lastEvent?: unknown;
  sentAt: Date;
  statusUpdatedAt?: Date;
};

export type CreateEmailDeliveryInput = {
  sesMessageId: string;
  accessGrantId?: string;
  emailKind: EmailKind;
  recipientEmail: string;
};

export class EmailDelivery extends AggregateRoot<EmailDeliveryRecord> {
  protected props: EmailDeliveryProps;

  private constructor(actorId: ActorId, props: EmailDeliveryProps, id?: EntityId) {
    super(id, actorId, 'emailDelivery');
    this.props = { ...props };
  }

  static create(input: CreateEmailDeliveryInput, actorId: ActorId): EmailDelivery {
    const comment = new EmailDelivery(actorId, {
      ...input,
      status: EmailStatus.send,
      sentAt: new Date(),
    });
    return comment;
  }

  static rehydrate(record: EmailDeliveryRecord): EmailDelivery {
    const comment = new EmailDelivery(record.createdBy, record, record.id);

    return comment;
  }

  sesMessageId(): EntityId {
    return this.props.sesMessageId;
  }

  updateStatus(actorId: EntityId, newStatus?: EmailStatus): void {
    if (newStatus && newStatus.rank >= this.props.status.rank) {
      this.props.status = newStatus;
      this.props.statusUpdatedAt = new Date();
      this.touch(actorId);
    }
  }
  setLastEvent(actorId: EntityId, message?: unknown) {
    if (message) {
      this.props.lastEvent = message;
      this.touch(actorId);
    }
  }
}
