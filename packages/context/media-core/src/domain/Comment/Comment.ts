/**
 * Comment: user comment attached to an Album or MediaItem (by resource type and ID).
 * Aggregate Root with its own lifecycle; references target and author by ID only.
 */

import type { ResourceTypeEnum } from '@packages/contracts';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import type { AuditRecord } from '../Entity';

export type CommentProps = {
  resourceType: ResourceTypeEnum;
  authorId: EntityId;
  content: string;
};

export type CommentRecord = {
  id: EntityId;
  resourceType: ResourceTypeEnum;
  authorId: EntityId;
  content: string;
} & AuditRecord;

export type CreateCommentInput = {
  resourceType: ResourceTypeEnum;
  authorId: EntityId;
  content: string;
};

export class Comment extends AggregateRoot<CommentRecord> {
  protected props: CommentProps;

  private constructor(id: EntityId, actorId: ActorId, props: CommentProps) {
    super(id, actorId);
    this.props = props;
  }

  static create(input: CreateCommentInput, actorId: ActorId): Comment {
    return new Comment(crypto.randomUUID(), actorId, input);
  }

  static rehydrate(record: CommentRecord): Comment {
    const comment = new Comment(record.id, record.createdBy, record);

    comment.rehydrateAudit(record);

    return comment;
  }

  editContent(content: string, actorId: ActorId): void {
    this.props.content = content;
    this.touch(actorId);
  }
}
