import { AppErrorCollection, Operation } from '@packages/contracts';
import { ActorId, EntityId, WriteResult } from '../../types/types';
import { Authorization, AuthorizationRecord } from '../Authorization/Authorization';
import { AuditRecord, ChildEntities, Entity } from '../Entity';
import { fail, ok } from '../utilities/writeResponse';

export type PublicLinkProps = {
  grantedBy: EntityId;
  linkToken: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type PublicLinkRecord = {
  id: string;
  albumId: EntityId;
  linkToken: string;
  grantedBy: EntityId;
  expiresAt?: Date;
  revokedAt?: Date;
  authorization: AuthorizationRecord;
} & AuditRecord;

export type CreatePublicLinkInput = {
  operations: Operation[];
  linkToken: string;
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
};

export class PublicLink extends Entity<PublicLinkRecord> {
  protected props: PublicLinkProps;
  #authorization: Authorization;

  private constructor(
    id: EntityId,
    actorId: ActorId,
    props: PublicLinkProps,
    authorization: Authorization,
  ) {
    super(id, actorId);
    this.props = props;
    this.#authorization = authorization;
  }

  static create(input: CreatePublicLinkInput, actorId: ActorId): PublicLink {
    const authorization = Authorization.create(
      {
        operations: input.operations,
        grantedBy: actorId,
        label: input.label,
        expiresAt: input.expiresAt,
      },
      actorId,
    );
    const publicLink = new PublicLink(
      crypto.randomUUID(),
      actorId,
      {
        linkToken: input.linkToken,
        grantedBy: actorId,
        expiresAt: input.expiresAt,
      },
      authorization,
    );

    return publicLink;
  }

  static rehydrate(record: PublicLinkRecord): PublicLink {
    const authorization = Authorization.rehydrate(record.authorization);

    const publicLink = new PublicLink(
      record.id,
      record.createdBy,
      {
        linkToken: record.linkToken,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
        grantedBy: record.createdBy,
      },
      authorization,
    );
    publicLink.rehydrateAudit(record);
    return publicLink;
  }
  linkToken(): string | undefined {
    return this.props.linkToken;
  }

  updateExpireDate(expiredDate: Date, actorId: ActorId): WriteResult<undefined> {
    if (expiredDate < new Date()) {
      return fail(AppErrorCollection.authorization.ExpireDateCannotBeInPast);
    }
    if (this.props.revokedAt) {
      return fail(AppErrorCollection.authorization.CannotUpdateExpiredDateIfRevoked);
    }
    const authResult = this.#authorization.updateExpireDate(expiredDate, actorId);
    if (!authResult.success) {
      return authResult;
    }
    this.props.expiresAt = expiredDate;
    this.touch(actorId);
    return ok(undefined);
  }

  revokePublicLink(actorId: ActorId): WriteResult<undefined> {
    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      return fail(AppErrorCollection.authorization.CannotRevokeAuthorizationIfAlreadyExpired);
    }
    const authResult = this.#authorization.revokeAuthorization(actorId);
    if (!authResult.success) {
      return authResult;
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
  authorization(): Authorization {
    return this.#authorization;
  }
  public override persistenceState(): Record<string, unknown> {
    return {
      ...super.persistenceState(),
      authorization: this.#authorization,
    };
  }

  protected childEntities(): ChildEntities {
    return {
      authorization: this.#authorization,
    };
  }
}
