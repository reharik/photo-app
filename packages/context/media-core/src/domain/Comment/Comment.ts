/**
 * Comment: user comment attached to an Album or MediaItem (by resource type and ID).
 * Aggregate Root with its own lifecycle; references target and author by ID only.
 *
 */

import type { CommentTargetType } from '@packages/contracts';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import type { AuditRecord } from '../Entity';

export type CommentRecord = {
  id: EntityId;
  targetType: CommentTargetType;
  targetId: EntityId;
  parentCommentId?: EntityId;
  authorId: EntityId;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
  deletedAt?: Date;
} & AuditRecord;

export type CommentProps = {
  targetType: CommentTargetType;
  targetId: EntityId;
  parentCommentId?: EntityId;
  authorId: EntityId;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
  deletedAt?: Date;
};

export type CreateCommentInput = {
  targetType: CommentTargetType;
  targetId: EntityId;
  parentCommentId?: EntityId;
  authorId: EntityId;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
};

export class Comment extends AggregateRoot<CommentRecord> {
  protected props: CommentProps;

  private constructor(actorId: ActorId, props: CommentProps, id?: EntityId) {
    super(id, actorId, 'comment');
    this.props = { ...props };
  }

  static create(input: CreateCommentInput, actorId: ActorId): Comment {
    return new Comment(actorId, { ...input });
  }

  static rehydrate(record: CommentRecord): Comment {
    const { id, createdAt, updatedAt, createdBy, updatedBy, ...rest } = record;
    const comment = new Comment(
      createdBy,
      {
        targetType: rest.targetType,
        targetId: rest.targetId,
        parentCommentId: rest.parentCommentId,
        authorId: rest.authorId,
        body: rest.body,
        displayName: rest.displayName,
        displayAvatarUrl: rest.displayAvatarUrl,
        deletedAt: rest.deletedAt,
      },
      id,
    );

    comment.rehydrateAudit({ createdAt, updatedAt, createdBy, updatedBy });
    return comment;
  }

  editBody(body: string, actorId: ActorId): void {
    this.props.body = body;
    this.touch(actorId);
  }

  markDeleted(actorId: ActorId): void {
    this.props.deletedAt = new Date();
    this.touch(actorId);
  }

  targetType(): CommentTargetType {
    return this.props.targetType;
  }

  targetId(): EntityId {
    return this.props.targetId;
  }

  isReply(): boolean {
    return this.props.parentCommentId !== undefined;
  }

  authorId(): EntityId {
    return this.props.authorId;
  }
}
