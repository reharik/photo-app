import { AppErrorCollection, Operation } from '@packages/contracts';
import { ActorId, EntityId, WriteResult } from '../../types/types';
import { AuditRecord, Entity } from '../Entity';
import { fail, ok } from '../utilities/writeResponse';

export type AuthorizationProps = {
  mediaItemId?: EntityId;
  albumId?: EntityId;
  grantedToUser?: EntityId;
  publicLinkId?: EntityId;
  operations: Operation[];
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type AuthorizationRecord = {
  id: string;
  mediaItemId?: string;
  albumId?: string;
  grantedToUser?: string;
  publicLinkId?: string;
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
      //TODO:  FOR NOW WE ARE JUST GRANTING ALL PERMISSIONS
      // WE WILL EVENTUALLY ADD PERMS INTO THE FORM

      operations: [Operation.download, Operation.comment],
      grantedToUser: input.grantedToUser,
      publicLinkId: input.publicLinkId,
      grantedBy: actorId,
      label: input.label,
      expiresAt: input.expiresAt,
      mediaItemId: input.mediaItemId,
      albumId: input.albumId,
    });
  }

  static rehydrate(record: AuthorizationRecord): Authorization {
    const asset = new Authorization(
      record.createdBy,
      {
        operations: record.operations,
        grantedToUser: record.grantedToUser,
        publicLinkId: record.publicLinkId ?? record.shareLinkId,
        grantedBy: record.grantedBy,
        label: record.label,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
        mediaItemId: record.mediaItemId,
        albumId: record.albumId,
      },
      record.id,
    );
    asset.rehydrateAudit(record);
    return asset;
  }
  grantedToUser(): EntityId | undefined {
    return this.props.grantedToUser;
  }
  publicLinkId(): EntityId | undefined {
    return this.props.publicLinkId;
  }
  // This is so we can set the id after creating the public link
  setPublicLinkId(publicLinkId: EntityId): void {
    this.props.publicLinkId = publicLinkId;
  }
  operations(): Operation[] {
    return this.props.operations;
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

  toPersistence(): AuthorizationRecord {
    return {
      id: this.id(),
      mediaItemId: this.props.mediaItemId,
      albumId: this.props.albumId,
      grantedToUser: this.props.grantedToUser,
      shareLinkId: this.props.publicLinkId,
      grantedBy: this.props.grantedBy,
      operations: this.props.operations,
      label: this.props.label,
      expiresAt: this.props.expiresAt,
      revokedAt: this.props.revokedAt,
      ...this.exportAudit(),
    };
  }
}
