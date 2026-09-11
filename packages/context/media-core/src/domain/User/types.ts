import { AuditRecord, EntityId, UserStatus } from '@packages/contracts';

export type UserProps = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  country?: string;
  passwordHash?: string;
  lastLoginAt?: Date;
  userStatus: UserStatus;
};

export type UserRecord = {
  id: EntityId;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  country?: string;
  passwordHash?: string;
  lastLoginAt?: Date;
  userStatus: UserStatus;
} & AuditRecord;

export type CreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  passwordHash?: string;
};
