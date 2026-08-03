import {
  AppErrorCollection,
  AuthorizationKind,
  fail,
  ok,
  Operation,
  WriteResult,
} from '@packages/contracts';
import crypto from 'crypto';
import { ActorId, EntityId } from '../../types/types';
import { Entity } from '../Entity';
import { AuthorizationProps, AuthorizationRecord, CreateAuthorizationInput } from './Authorization';
import { PublicLinkAuthorization } from './PublicLinkAuthorization';
import { UserAuthorization } from './UserAuthorization';

export type PendingUserAuthorizationProps = Omit<
  AuthorizationProps,
  'linkToken' | 'grantedToUser' | 'kind'
> & {
  grantedToUser: EntityId;
  linkToken: string;
  kind: typeof AuthorizationKind.pending;
};

export type PendingUserAuthorizationRecord = Omit<
  AuthorizationRecord,
  'linkToken' | 'grantedToUser' | 'kind'
> & {
  grantedToUser: EntityId;
  linkToken: string;
  kind: typeof AuthorizationKind.pending;
};

export type CreatePendingUserAuthorizationInput = Omit<
  CreateAuthorizationInput,
  'grantedToUser'
> & {
  grantedToUser: EntityId;
};

export class PendingUserAuthorization extends Entity<PendingUserAuthorizationRecord> {
  protected props: PendingUserAuthorizationProps;

  private constructor(actorId: ActorId, props: PendingUserAuthorizationProps, id?: EntityId) {
    super(id, actorId, 'access_grant');
    this.props = props;
  }

  static create(
    input: CreatePendingUserAuthorizationInput,
    actorId: ActorId,
  ): PendingUserAuthorization {
    const linkToken = crypto.randomBytes(16).toString('hex');
    return new PendingUserAuthorization(actorId, {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
      //TODO:  FOR NOW WE ARE JUST GRANTING ALL PERMISSIONS
      // WE WILL EVENTUALLY ADD PERMS INTO THE FORM

      operations: [Operation.download, Operation.comment],
      grantedToUser: input.grantedToUser,
      linkToken,
      grantedBy: actorId,
      label: input.label,
      expiresAt: input.expiresAt,
      albumId: input.albumId,
      kind: AuthorizationKind.pending,
    });
  }

  static rehydrate(record: PendingUserAuthorizationRecord): PendingUserAuthorization {
    const asset = new PendingUserAuthorization(record.createdBy, record, record.id);
    asset.rehydrateAudit(record);
    return asset;
  }
  grantedToUser(): EntityId {
    return this.props.grantedToUser;
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

  albumId(): EntityId {
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
  convertAndCreate(actorId: EntityId): {
    userAuthorization: UserAuthorization;
    publicLinkAuthorization: PublicLinkAuthorization;
  } {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { linkToken, kind: kindA, ...uaProps } = this.props;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { grantedToUser, kind: kindB, ...plaProps } = this.props;
    const publicLinkAuthProps = {
      ...plaProps,
      ...this.exportAudit(),
      grantedToUser: null,
      id: this.id(),
      kind: AuthorizationKind.public,
    };
    const ua = UserAuthorization.create(uaProps, actorId);
    const pla = PublicLinkAuthorization.fromConverted(publicLinkAuthProps, actorId);
    return { userAuthorization: ua, publicLinkAuthorization: pla };
  }
}
