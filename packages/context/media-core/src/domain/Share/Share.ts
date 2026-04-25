import { SharePermission } from '@packages/contracts';
import { ActorId, EntityId } from '../../types/types';
import { Entity, EntityAuditRecord } from '../Entity';

export type ShareProps = {
  grantedToUser?: EntityId;
  token?: string;
  permission: SharePermission;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type ShareRecord = {
  id: string;
  grantedToUser?: string;
  token?: string;
  permission: SharePermission;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
} & EntityAuditRecord;

export type CreateShareInput = {
  permission: SharePermission;
};

export class Share extends Entity<ShareRecord> {
  protected props: ShareProps;

  private constructor(id: EntityId, actorId: ActorId, props: ShareProps) {
    super(id, actorId);
    this.props = props;
  }

  static create(input: CreateShareInput, actorId: ActorId): Share {
    return new Share(crypto.randomUUID(), actorId, {
      permission: SharePermission.view,
    });
  }

  static rehydrate(record: ShareRecord): Share {
    const asset = new Share(record.id, record.createdBy, {
      permission: record.permission,
      grantedToUser: record.grantedToUser,
      token: record.token,
      label: record.label,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
    });
    asset.rehydrateAudit(record);
    return asset;
  }
}
