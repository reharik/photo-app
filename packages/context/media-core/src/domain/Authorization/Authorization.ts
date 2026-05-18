import { AppErrorCollection, SharePermission } from '@packages/contracts';
import { ActorId, EntityId, WriteResult } from '../../types/types';
import { AuditRecord, Entity } from '../Entity';
import { fail, ok } from '../utilities/writeResponse';

export type AuthorizationProps = {
  grantedToUser?: EntityId;
  publicLinkId?: EntityId;
  permission: SharePermission;
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type AuthorizationRecord = {
  id: string;
  grantedToUser?: string;
  publicLinkId?: string;
  /** `access_grant.share_link_id` as returned by Knex (stringcase); not set on newly serialized rows. */
  shareLinkId?: string;
  grantedBy: EntityId;
  permission: SharePermission;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
} & AuditRecord;

export type CreateAuthorizationInput = {
  permission: SharePermission;
  publicLinkId?: EntityId;
  grantedToUser?: EntityId;
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
};

export class Authorization extends Entity<AuthorizationRecord> {
  protected props: AuthorizationProps;

  private constructor(id: EntityId, actorId: ActorId, props: AuthorizationProps) {
    super(id, actorId);
    this.props = props;
  }

  static create(input: CreateAuthorizationInput, actorId: ActorId): Authorization {
    return new Authorization(crypto.randomUUID(), actorId, {
      permission: input.permission,
      grantedToUser: input.grantedToUser,
      publicLinkId: input.publicLinkId,
      grantedBy: actorId,
      label: input.label,
      expiresAt: input.expiresAt,
    });
  }

  static rehydrate(record: AuthorizationRecord): Authorization {
    const asset = new Authorization(record.id, record.createdBy, {
      permission: record.permission,
      grantedToUser: record.grantedToUser,
      publicLinkId: record.publicLinkId ?? record.shareLinkId,
      grantedBy: record.grantedBy,
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
  publicLinkId(): EntityId | undefined {
    return this.props.publicLinkId;
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
      return fail(AppErrorCollection.authorization.ExpireDateCannotBeInPast);
    }
    if (this.props.revokedAt) {
      return fail(AppErrorCollection.authorization.CannotUpdateExpiredDateIfRevoked);
    }
    this.props.expiresAt = expiredDate;
    this.touch(actorId);
    return ok(undefined);
  }

  revokeAuthorization(actorId: ActorId): WriteResult<undefined> {
    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      return fail(AppErrorCollection.authorization.CannotRevokeAuthorizationIfAlreadyExpired);
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
