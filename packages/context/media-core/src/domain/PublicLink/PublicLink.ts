import { AppErrorCollection, Operation } from '@packages/contracts';
import { ActorId, EntityId, WriteResult } from '../../types/types';
import { Authorization, AuthorizationRecord } from '../Authorization/Authorization';
import { AuditRecord, ChildEntities, Entity } from '../Entity';
import { fail, ok } from '../utilities/writeResponse';

export type PublicLinkProps = {
  albumId: EntityId;
  grantedBy: EntityId;
  linkToken: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type PublicLinkRecord = PublicLinkProps & {
  id: string;
} & AuditRecord;

export type PublicLinkChildRecords = {
  authorization: AuthorizationRecord;
};

export type CreatePublicLinkInput = {
  operations: Operation[];
  linkToken: string;
  grantedBy: EntityId;
  label?: string;
  expiresAt?: Date;
  albumId: EntityId;
};

export class PublicLink extends Entity<PublicLinkRecord> {
  protected props: PublicLinkProps;
  #authorization: Authorization;
  #removedAuthorization: Authorization[] | [] = [];

  private constructor(
    actorId: ActorId,
    props: PublicLinkProps,
    authorization: Authorization,
    id?: EntityId,
  ) {
    super(id, actorId, 'share_link');
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
        albumId: input.albumId,
      },
      actorId,
    );
    const publicLink = new PublicLink(
      actorId,
      {
        linkToken: input.linkToken,
        grantedBy: actorId,
        expiresAt: input.expiresAt,
        albumId: input.albumId,
      },
      authorization,
    );
    authorization.setPublicLinkId(publicLink.id());

    return publicLink;
  }

  static rehydrate(record: PublicLinkRecord, childRecords: PublicLinkChildRecords): PublicLink {
    const authorization = Authorization.rehydrate(childRecords.authorization);

    const publicLink = new PublicLink(
      record.createdBy,
      {
        albumId: record.albumId,
        linkToken: record.linkToken,
        expiresAt: record.expiresAt,
        revokedAt: record.revokedAt,
        grantedBy: record.createdBy,
      },
      authorization,
      record.id,
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

  childEntities(): ChildEntities {
    return {
      authorization: { upsert: [this.#authorization], removed: this.#removedAuthorization },
    };
  }
}
