import { ContractError, fail, ok, UserStatus, WriteResult } from '@packages/contracts';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import { UserAuthorization, UserAuthorizationRecord } from '../Authorization/UserAuthorization';
import { CreateUserInput, UserRecord } from './types';

type ActivateProps = { firstName: string; lastName: string; phone?: string; passwordHash: string };

export type PendingUserProps = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  passwordHash?: string;
  userStatus: UserStatus;
};
export type PendingUserChildRecords = {
  authorizations: UserAuthorizationRecord[];
};

export class PendingUser extends AggregateRoot<UserRecord> {
  protected props: PendingUserProps;
  public readonly kind = 'pending' as const;

  #authorizations: UserAuthorization[] = [];

  private constructor(actorId: ActorId, props: PendingUserProps, id?: EntityId) {
    super(id, actorId, 'user');
    this.props = props;
  }

  static create(input: CreateUserInput, actorId: ActorId): PendingUser {
    return new PendingUser(actorId, { ...input, userStatus: UserStatus.pending });
  }

  static rehydrate(record: UserRecord, childRecords: PendingUserChildRecords): PendingUser {
    const pendingUser = new PendingUser(record.createdBy, record, record.id);
    pendingUser.rehydrateAudit(record);
    pendingUser.#authorizations = childRecords.authorizations.map((r) =>
      UserAuthorization.rehydrate(r),
    );

    return pendingUser;
  }

  activate(
    { firstName, lastName, phone, passwordHash }: ActivateProps,
    actorId: ActorId,
  ): WriteResult<void> {
    if (phone !== undefined) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        return fail(ContractError.InvalidPhoneNumber);
      }
    }
    this.props.firstName = firstName;
    this.props.lastName = lastName;
    this.props.phone = phone;
    this.props.passwordHash = passwordHash;
    this.props.userStatus = UserStatus.active;

    const authorizationIds = this.#authorizations.map((x) => x.id());
    this.recordEvent('pendingUserActivated', { userId: this.id(), authorizationIds }, actorId);
    this.touch(actorId);
    return ok(undefined);
  }
  email(): string {
    return this.props.email;
  }

  userStatus(): UserStatus {
    return this.props.userStatus;
  }
}
