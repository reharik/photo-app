import { AppErrorCollection, SharePermission } from '@packages/contracts';
import { ActorId, EntityId, WriteResult } from '../../types/types';
import { Entity, EntityAuditRecord } from '../Entity';
import { fail, ok } from '../utilities/writeResponse';

export type ShareProps = {
  grantedToUser?: EntityId;
  token?: string;
  permission: SharePermission;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type ShareRecord = {
  id: string;
  grantedToUser?: string;
  token?: string;
  permission: SharePermission;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
} & EntityAuditRecord;

export type CreateShareInput = {
  permission: SharePermission;
  grantedToUser?: EntityId;
  token?: string;
  label?: string;
  expiresAt?: Date;
};

export class Share extends Entity<ShareRecord> {
  protected props: ShareProps;

  private constructor(id: EntityId, actorId: ActorId, props: ShareProps) {
    super(id, actorId);
    this.props = props;
  }

  static create(input: CreateShareInput, actorId: ActorId): Share {
    return new Share(crypto.randomUUID(), actorId, {
      permission: input.permission,
      grantedToUser: input.grantedToUser,
      token: input.token,
      label: input.label,
      expiresAt: input.expiresAt,
    });
  }

  static rehydrate(record: ShareRecord): Share {
    const asset = new Share(record.id, record.createdBy, {
      permission: record.permission,
      grantedToUser: record.grantedToUser,
      token: record.token,
      label: record.label,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
    });
    asset.rehydrateAudit(record);
    return asset;
  }
  grantedToUser(): EntityId | undefined {
    return this.props.grantedToUser;
  }
  permission(): SharePermission {
    return this.props.permission;
  }
  label(): string | undefined {
    return this.props.label;
  }
  updateLabel(label: string, actorId: ActorId): WriteResult<undefined> {
    this.props.label = label;
    this.touch(actorId);
    return ok(undefined);
  }

  updateExpireDate(expiredDate: Date, actorId: ActorId): WriteResult<undefined> {
    if (expiredDate < new Date()) {
      return fail(AppErrorCollection.share.ExpireDateCannotBeInPast);
    }
    if (this.props.revokedAt) {
      return fail(AppErrorCollection.share.CannotUpdateExpiredDateIfRevoked);
    }
    this.props.expiresAt = expiredDate;
    this.touch(actorId);
    return ok(undefined);
  }

  revokeShare(actorId: ActorId): WriteResult<undefined> {
    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      return fail(AppErrorCollection.share.CannotRevokeShareIfAlreadyExpired);
    }
    this.props.revokedAt = new Date();
    this.touch(actorId);
    return ok(undefined);
  }

  expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }
  revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }
}
