import { AppErrorCollection, fail, ok, Operation, WriteResult } from '@packages/contracts';
import { ActorId, EntityId } from '../../types/types';
import { AuditRecord, Entity } from '../Entity';

export type AuthorizationProps = {
  mediaItemId?: EntityId;
  albumId?: EntityId;
  grantedToUser?: EntityId;
  shareLinkId?: EntityId;
  operations: Operation[];
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
} & AuditRecord;

export type AuthorizationRecord = {
  id: string;
  mediaItemId?: string;
  albumId?: string;
  grantedToUser?: string;
  shareLinkId?: string;
  grantedBy: EntityId;
  operations: Operation[];
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
} & AuditRecord;

export type CreateAuthorizationInput = {
  operations: Operation[];
  publicLinkId?: EntityId;
  grantedToUser?: EntityId;
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
  mediaItemId?: EntityId;
  albumId?: EntityId;
};

export class Authorization extends Entity<AuthorizationRecord> {
  protected props: AuthorizationProps;

  private constructor(actorId: ActorId, props: AuthorizationProps, id?: EntityId) {
    super(id, actorId, 'access_grant');
    this.props = props;
  }

  static create(input: CreateAuthorizationInput, actorId: ActorId): Authorization {
    return new Authorization(actorId, {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
      //TODO:  FOR NOW WE ARE JUST GRANTING ALL PERMISSIONS
      // WE WILL EVENTUALLY ADD PERMS INTO THE FORM

      operations: [Operation.download, Operation.comment],
      grantedToUser: input.grantedToUser,
      shareLinkId: input.publicLinkId,
      grantedBy: actorId,
      label: input.label,
      expiresAt: input.expiresAt,
      mediaItemId: input.mediaItemId,
      albumId: input.albumId,
    });
  }

  static rehydrate(record: AuthorizationRecord): Authorization {
    const asset = new Authorization(record.createdBy, record, record.id);
    asset.rehydrateAudit(record);
    return asset;
  }
  grantedToUser(): EntityId | undefined {
    return this.props.grantedToUser;
  }
  publicLinkId(): EntityId | undefined {
    return this.props.shareLinkId;
  }
  // This is so we can set the id after creating the public link
  setPublicLinkId(publicLinkId: EntityId): void {
    this.props.shareLinkId = publicLinkId;
  }
  operations(): Operation[] {
    return this.props.operations;
  }

  updateOperations(operations: Operation[], actorId: ActorId): WriteResult<undefined> {
    this.props.operations = operations;
    this.touch(actorId);
    return ok(undefined);
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
  createdAt(): Date | undefined {
    return this.props.createdAt;
  }
}
