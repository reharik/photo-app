import { ShareLinkPermissionEnum } from 'packages/foundation/contracts/dist/src/enums/shareLinkPermission';
import { EntityId } from '../../types/types';
import { Entity, EntityAuditRecord } from '../Entity';

export type ShareProps = {
  grantedToUser?: EntityId;
  token?: string;
  permission: ShareLinkPermissionEnum;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type ShareRecord = {
  id: string;
  grantedToUser?: string;
  token?: string;
  permission: ShareLinkPermissionEnum;
  label?: string;
  expiresAt?: Date;
  revokedAt?: Date;
} & EntityAuditRecord;

export type CreateShareInput = {};

export class Share extends Entity<ShareRecord> {
  protected props: ShareProps;

  private constructor(id: EntityId, actorId: ActorId, props: ShareProps) {
    super(id, actorId);
    this.props = props;
  }

  static create(input: CreateShareInput, actorId: ActorId): Share {
    return new Share(crypto.randomUUID(), actorId, {
      kind: input.kind,
      mimeType: input.mimeType,
      status: ShareStatus.pending,
    });
  }

  static rehydrate(record: ShareRecord): Share {
    const asset = new Share(record.id, record.createdBy, {
      kind: record.kind,
      mimeType: record.mimeType,
      width: record.width,
      height: record.height,
      fileSizeBytes: record.fileSizeBytes,
      status: record.status,
    });
    asset.rehydrateAudit(record);
    return asset;
  }
}
