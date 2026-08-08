import {
  AppErrorCollection,
  AuthorizationKind,
  fail,
  ok,
  Operation,
  WriteResult,
} from '@packages/contracts';
import { ActorId, EntityId } from '../../types/types';
import { Entity } from '../Entity';
import { AuthorizationProps, AuthorizationRecord, CreateAuthorizationInput } from './Authorization';

export type UserAuthorizationProps = AuthorizationProps & {
  grantedToUser: EntityId;
  linkToken: undefined;
  kind: typeof AuthorizationKind.user;
};

export type UserAuthorizationRecord = AuthorizationRecord & {
  grantedToUser: EntityId;
  linkToken: undefined;
  kind: typeof AuthorizationKind.user;
};

export type CreateUserAuthorizationInput = CreateAuthorizationInput & {
  grantedToUser: EntityId;
};

export class UserAuthorization extends Entity<UserAuthorizationRecord> {
  protected props: UserAuthorizationProps;

  private constructor(actorId: ActorId, props: UserAuthorizationProps, id?: EntityId) {
    super(id, actorId, 'access_grant');
    this.props = props;
  }

  static create(input: CreateUserAuthorizationInput, actorId: ActorId): UserAuthorization {
    return new UserAuthorization(actorId, {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
      //TODO:  FOR NOW WE ARE JUST GRANTING ALL PERMISSIONS
      // WE WILL EVENTUALLY ADD PERMS INTO THE FORM

      operations: [Operation.download, Operation.comment],
      grantedToUser: input.grantedToUser,
      grantedBy: actorId,
      label: input.label,
      expiresAt: input.expiresAt,
      albumId: input.albumId,
      linkToken: undefined,
      kind: AuthorizationKind.user,
    });
  }

  static rehydrate(record: UserAuthorizationRecord): UserAuthorization {
    const asset = new UserAuthorization(record.createdBy, record, record.id);
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
}
