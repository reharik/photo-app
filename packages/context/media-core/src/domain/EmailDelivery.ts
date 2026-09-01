import { EmailKind, EmailStatus } from '@packages/contracts';
import { ActorId, EntityId } from '../types';
import { AggregateRoot } from './AggregateRoot';
import { AuditRecord } from './Entity';

export type EmailDeliveryRecord = {
  id: EntityId;
  sesMessageId: string;
  authorizationId?: string;
  emailKind: EmailKind;
  recipientEmail: string;
  status: EmailStatus;
  bounceType?: string;
  diagnosticCode?: string;
  lastEvent?: Record<string, unknown>;
  sentAt: Date;
  statusUpdatedAt?: Date;
} & AuditRecord;

export type EmailDeliveryProps = {
  sesMessageId: string;
  authorizationId?: string;
  emailKind: EmailKind;
  recipientEmail: string;
  status: EmailStatus;
  bounceType?: string;
  diagnosticCode?: string;
  lastEvent?: Record<string, unknown>;
  sentAt: Date;
  statusUpdatedAt?: Date;
};

export type CreateEmailDeliveryInput = {
  sesMessageId: string;
  authorizationId?: string;
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
      status: EmailStatus.sent,
      sentAt: new Date(),
    });
    return comment;
  }

  static rehydrate(record: EmailDeliveryRecord): EmailDelivery {
    const comment = new EmailDelivery(record.createdBy, record, record.id);

    return comment;
  }
}
