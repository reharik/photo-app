import { Operation } from '@packages/contracts';
import { EntityId } from '../../types/types';
import { AuditRecord } from '../Entity';
import type { PendingUserAuthorizationRecord } from './PendingUserAuthorization';
import type { PublicLinkAuthorizationRecord } from './PublicLinkAuthorization';
import type { UserAuthorizationRecord } from './UserAuthorization';

export type AuthorizationProps = {
  albumId: EntityId;
  operations: Operation[];
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
} & AuditRecord;

export type AuthorizationRecord = {
  id: string;
  albumId: string;
  grantedBy: EntityId;
  operations: Operation[];
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
} & AuditRecord;

export type AnyAuthorizationRecord =
  UserAuthorizationRecord | PendingUserAuthorizationRecord | PublicLinkAuthorizationRecord;

/**
 * Record-side twin of `isAuthorizationKind` (see systemAuthorizationRepository). Same
 * reason for existing: `kind` is a smart-enum item, so the literal sits at `kind.value`
 * and TypeScript will not narrow a parent union through a nested path
 * (microsoft/TypeScript#18758). The imports above are type-only, so this adds no runtime
 * cycle with the three record modules that import `AuthorizationRecord` from here.
 */
export const isAuthorizationRecordKind = <V extends AnyAuthorizationRecord['kind']['value']>(
  record: AnyAuthorizationRecord,
  value: V,
): record is Extract<AnyAuthorizationRecord, { kind: { value: V } }> => record.kind.value === value;

export type CreateAuthorizationInput = {
  operations: Operation[];
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
  albumId: EntityId;
};

// export class Authorization extends Entity<AuthorizationRecord> {
//   protected props: AuthorizationProps;

//   private constructor(actorId: ActorId, props: AuthorizationProps, id?: EntityId) {
//     super(id, actorId, 'access_grant');
//     this.props = props;
//   }

//   static create(input: CreateAuthorizationInput, actorId: ActorId): Authorization {
//     return new Authorization(actorId, {
//       createdAt: new Date(),
//       updatedAt: new Date(),
//       createdBy: actorId,
//       updatedBy: actorId,
//       //TODO:  FOR NOW WE ARE JUST GRANTING ALL PERMISSIONS
//       // WE WILL EVENTUALLY ADD PERMS INTO THE FORM

//       operations: [Operation.download, Operation.comment],
//       grantedToUser: input.grantedToUser,
//       grantedBy: actorId,
//       label: input.label,
//       expiresAt: input.expiresAt,
//       albumId: input.albumId,
//     });
//   }

//   static rehydrate(record: AuthorizationRecord): Authorization {
//     const asset = new Authorization(record.createdBy, record, record.id);
//     asset.rehydrateAudit(record);
//     return asset;
//   }
//   grantedToUser(): EntityId | undefined {
//     return this.props.grantedToUser;
//   }
//   linkToken(): string | undefined {
//     return this.props.linkToken;
//   }
//   // This is so we can set the id after creating the public link

//   operations(): Operation[] {
//     return this.props.operations;
//   }

//   updateOperations(operations: Operation[], actorId: ActorId): WriteResult<undefined> {
//     this.props.operations = operations;
//     this.touch(actorId);
//     return ok(undefined);
//   }

//   label(): string | undefined {
//     return this.props.label;
//   }
//   updateLabel(label: string, actorId: ActorId): WriteResult<undefined> {
//     this.props.label = label;
//     this.touch(actorId);
//     return ok(undefined);
//   }

//   updateExpireDate(expiredDate: Date, actorId: ActorId): WriteResult<undefined> {
//     if (expiredDate < new Date()) {
//       return fail(AppErrorCollection.authorization.ExpireDateCannotBeInPast);
//     }
//     if (this.props.revokedAt) {
//       return fail(AppErrorCollection.authorization.CannotUpdateExpiredDateIfRevoked);
//     }
//     this.props.expiresAt = expiredDate;
//     this.touch(actorId);
//     return ok(undefined);
//   }

//   revokeAuthorization(actorId: ActorId): WriteResult<undefined> {
//     if (this.props.expiresAt && this.props.expiresAt < new Date()) {
//       return fail(AppErrorCollection.authorization.CannotRevokeAuthorizationIfAlreadyExpired);
//     }
//     this.props.revokedAt = new Date();
//     this.touch(actorId);
//     return ok(undefined);
//   }
//   albumId(): EntityId {
//     return this.props.albumId;
//   }
//   expiresAt(): Date | undefined {
//     return this.props.expiresAt;
//   }
//   revokedAt(): Date | undefined {
//     return this.props.revokedAt;
//   }
//   createdAt(): Date | undefined {
//     return this.props.createdAt;
//   }
// }
