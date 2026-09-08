import type { ActorId, EntityId } from '@packages/contracts';
import { AlbumMemberRole, type AuditRecord } from '@packages/contracts';
import { DomainEntity } from '../DomainEntity';

export type AlbumMemberProps = {
  userId: EntityId;
  role: AlbumMemberRole;
  albumId: EntityId;
};

export type AlbumMemberRecord = {
  id: EntityId;
  userId: EntityId;
  role: AlbumMemberRole;
  albumId: EntityId;
} & AuditRecord;

export class AlbumMember extends DomainEntity<AlbumMemberRecord> {
  protected props: AlbumMemberProps;

  private constructor(actorId: ActorId, props: AlbumMemberProps, id?: EntityId) {
    super(id, actorId, 'album_member');
    this.props = props;
  }

  public static create(props: AlbumMemberProps, actorId: ActorId): AlbumMember {
    return new AlbumMember(actorId, props);
  }

  public static rehydrate(record: AlbumMemberRecord): AlbumMember {
    const member = new AlbumMember(
      record.createdBy,
      {
        userId: record.userId,
        role: record.role,
        albumId: record.albumId,
      },
      record.id,
    );

    member.rehydrateAudit(record);
    return member;
  }

  public userId(): string {
    return this.props.userId;
  }

  public role(): AlbumMemberRole {
    return this.props.role;
  }

  public changeRole(role: AlbumMemberRole, actorId: ActorId): void {
    this.props.role = role;
    this.touch(actorId);
  }
}
