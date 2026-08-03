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

export type PublicLinkAuthorizationProps = Omit<
  AuthorizationProps,
  'linkToken' | 'grantedToUser' | 'kind'
> & {
  grantedToUser: string | null;
  linkToken: string;
  kind: typeof AuthorizationKind.public;
};

export type PublicLinkAuthorizationRecord = Omit<
  AuthorizationRecord,
  'linkToken' | 'grantedToUser' | 'kind'
> & {
  grantedToUser: string | null;
  linkToken: string;
  kind: typeof AuthorizationKind.public;
};

export type PublicLinkAuthorizationConversionRecord = Omit<
  AuthorizationRecord,
  'linkToken' | 'grantedToUser' | 'kind'
> & {
  grantedToUser: null;
  linkToken: string;
  kind: typeof AuthorizationKind.public;
};

export type CreatePublicLinkAuthorizationInput = Omit<CreateAuthorizationInput, 'grantedToUser'> & {
  grantedToUser: undefined;
};

export class PublicLinkAuthorization extends Entity<PublicLinkAuthorizationRecord> {
  protected props: PublicLinkAuthorizationProps;

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
      albumId: input.albumId,
      // null, not undefined: this is the value that reaches the column. undefined made knex
      // omit granted_to_user entirely, so the record type's claim was only true by way of
      // the `as TRecord` cast in Entity.toPersistence. The conversion path already used null.
      grantedToUser: null,
      kind: AuthorizationKind.public,
    });
  }

  /**
   * The public-link half of converting a PendingUserAuthorization: same access_grant row
   * (same id), now carrying only the link token. The pending row is REUSED, not replaced.
   *
   * ⚠️ The last two lines are ordered and the order is load-bearing. `rehydrateAudit()`
   * sets `_isDirty = false` — it exists for rows loaded from the database, which are clean
   * by definition — so the explicit `_isDirty = true` MUST come after it. Swap them and the
   * conversion becomes a silent no-op: the entity is dropped from the dirty set, no UPDATE
   * is issued, and the row stays PENDING while the in-memory aggregate believes it is
   * PUBLIC. Nothing fails; the grant simply never converts.
   *
   * `touch(actorId)` is deliberately NOT used here even though this is a mutation. touch()
   * would stamp updatedAt/updatedBy with the activating user, and we want the pending row's
   * original audit values preserved — this converts an existing invitation rather than
   * recording a fresh act by the activator. Hence rehydrateAudit (restore the stored audit)
   * plus a manual dirty flag, instead of the usual touch().
   */
  static fromConverted(
    pendingUserAuthProps: PublicLinkAuthorizationConversionRecord,
    actorId: EntityId,
  ): PublicLinkAuthorization {
    const asset = new PublicLinkAuthorization(
      actorId,
      pendingUserAuthProps,
      pendingUserAuthProps.id,
    );
    asset.rehydrateAudit(pendingUserAuthProps);
    asset._isDirty = true;
    return asset;
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
  linkToken(): string {
    return this.props.linkToken;
  }
}
