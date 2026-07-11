/**
 * User: application user identity.
 * Small Aggregate Root for identity/profile/account state only.
 * References other aggregates by ID only; does not own collections of albums, media, comments, or notifications.
 */

import { UserStatus } from '@packages/contracts';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import { CreateUserInput, UserProps, UserRecord } from './types';

export const isActiveUserRecord = (r: UserRecord): r is UserRecord =>
  r.userStatus.equals(UserStatus.active);

export class User extends AggregateRoot<UserRecord> {
  protected props: UserProps;
  public readonly kind = 'active' as const;
  private constructor(actorId: ActorId, props: UserProps, id?: EntityId) {
    super(id, actorId, 'user');
    this.props = props;
  }

  static create(input: CreateUserInput, actorId: ActorId): User {
    return new User(actorId, { ...input, userStatus: UserStatus.pending });
  }

  static rehydrate(record: UserRecord): User {
    const user = new User(record.createdBy, record, record.id);
    user.rehydrateAudit(record);

    return user;
  }

  /** The user-facing identifier used when shared with by handle (email, today). */
  handle(): string {
    return this.props.email;
  }

  updateUserName(firstName: string, lastName: string, actorId: ActorId): void {
    this.props.firstName = firstName;
    this.props.lastName = lastName;
    this.touch(actorId);
  }

  updateEmail(email: string, actorId: ActorId): void {
    this.props.email = email;
    this.touch(actorId);
  }

  updateContactInfo(
    contact: {
      phone?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      postalCode?: string;
      state?: string;
      country?: string;
    },
    actorId: ActorId,
  ): void {
    if (contact.phone !== undefined) this.props.phone = contact.phone;
    if (contact.addressLine1 !== undefined) this.props.addressLine1 = contact.addressLine1;
    if (contact.addressLine2 !== undefined) this.props.addressLine2 = contact.addressLine2;
    if (contact.city !== undefined) this.props.city = contact.city;
    if (contact.postalCode !== undefined) this.props.postalCode = contact.postalCode;
    if (contact.state !== undefined) this.props.state = contact.state;
    if (contact.country !== undefined) this.props.country = contact.country;
    this.touch(actorId);
  }

  setPassword(passwordHash: string, actorId: ActorId): void {
    this.props.passwordHash = passwordHash;
    this.touch(actorId);
  }

  recordLogin(actorId: ActorId): void {
    this.props.lastLoginAt = new Date();
    this.touch(actorId);
  }

  firstName(): string | undefined {
    return this.props.firstName;
  }
  lastName(): string | undefined {
    return this.props.lastName;
  }
  fullName(): string {
    return this.props.firstName + ' ' + this.props.lastName;
  }
  email(): string {
    return this.props.email;
  }
  userStatus(): UserStatus {
    return this.props.userStatus;
  }
  isNew(): boolean {
    return this._isNew;
  }
}
