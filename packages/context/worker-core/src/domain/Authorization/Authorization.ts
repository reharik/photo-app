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
  grantedBy: EntityId;
  label?: string;
  albumId: EntityId;
};
