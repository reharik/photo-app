import { AppErrorCollection, fail, ok, Operation, WriteResult } from '@packages/contracts';
import crypto from 'crypto';
import { ActorId, EntityId } from '../../types/types';
import { Entity } from '../Entity';
import { AuthorizationProps, AuthorizationRecord, CreateAuthorizationInput } from './Authorization';

export type PublicLinkAuthorizationProps = Omit<
  AuthorizationProps,
  'linkToken' | 'grantedToUser'
> & {
  grantedToUser: undefined;
  linkToken: string;
};

export type PublicLinkAuthorizationRecord = Omit<
  AuthorizationRecord,
  'linkToken' | 'grantedToUser'
> & {
  grantedToUser: undefined;
  linkToken: string;
};

export type CreatePublicLinkAuthorizationInput = Omit<CreateAuthorizationInput, 'grantedToUser'> & {
  grantedToUser: undefined;
};

export const isPublicLinkAuthRecord = (
  r: AuthorizationRecord,
): r is PublicLinkAuthorizationRecord => r.linkToken != null && r.grantedToUser == null;

export class PublicLinkAuthorization extends Entity<PublicLinkAuthorizationRecord> {
  protected props: PublicLinkAuthorizationProps;
  public readonly kind = 'publicLink' as const;

  private constructor(actorId: ActorId, props: PublicLinkAuthorizationProps, id?: EntityId) {
    super(id, actorId, 'access_grant');
    this.props = props;
  }

  static create(
    input: CreatePublicLinkAuthorizationInput,
    actorId: ActorId,
  ): PublicLinkAuthorization {
    const linkToken = crypto.randomBytes(16).toString('hex');

    return new PublicLinkAuthorization(actorId, {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
      //TODO:  FOR NOW WE ARE JUST GRANTING ALL PERMISSIONS
      // WE WILL EVENTUALLY ADD PERMS INTO THE FORM

      operations: [Operation.download, Operation.comment],
      linkToken,
      grantedBy: actorId,
      label: input.label,
      expiresAt: input.expiresAt,
      mediaItemId: input.mediaItemId,
      albumId: input.albumId,
      grantedToUser: undefined,
    });
  }

  static rehydrate(record: PublicLinkAuthorizationRecord): PublicLinkAuthorization {
    const asset = new PublicLinkAuthorization(record.createdBy, record, record.id);
    asset.rehydrateAudit(record);
    return asset;
  }

  // This is so we can set the id after creating the public link
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
  mediaItemId(): EntityId | undefined {
    return this.props.mediaItemId;
  }
  albumId(): EntityId | undefined {
    return this.props.albumId;
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
  linkToken(): string {
    return this.props.linkToken;
  }
}
