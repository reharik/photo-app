/**
 * Comment: user comment attached to an Album or MediaItem (by resource type and ID).
 * Aggregate Root with its own lifecycle; references target and author by ID only.
 *
 */

import { EntityType, ok, WriteResult } from '@packages/contracts';
import { groupByMapping } from '@packages/infrastructure';
import { EnumSubset } from '@reharik/smart-enum';
import { DBReactionCounts } from '../../services/readServices/types';
import { Reaction } from '../../services/writeServices/mediaItem/writeMediaItem.types';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import type { AuditRecord, VOCollection } from '../Entity';

export type CommentReactionRecord = Omit<Reaction, 'id'> & {
  id: string;
};

export type CommentRecord = {
  id: EntityId;
  targetType: EnumSubset<EntityType, 'mediaItem'>;
  targetId: EntityId;
  parentCommentId?: EntityId;
  authorId: EntityId;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
  deletedAt?: Date;
} & AuditRecord;

export type CommentProps = {
  targetType: EnumSubset<EntityType, 'mediaItem'>;
  targetId: EntityId;
  parentCommentId?: EntityId;
  authorId: EntityId;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
  deletedAt?: Date;
  reactionCounts?: DBReactionCounts;
};

export type CreateCommentInput = {
  targetType: EnumSubset<EntityType, 'mediaItem'>;
  targetId: EntityId;
  parentCommentId?: EntityId;
  parentAuthorId?: EntityId;
  authorId: EntityId;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
};

export type CommentChildRecords = {
  reactions: CommentReactionRecord[];
};

export class Comment extends AggregateRoot<CommentRecord> {
  protected props: CommentProps;
  #reactions: Reaction[] = [];
  #addedReactions: Reaction[] = [];
  #removedReactions: { targetId: EntityId; targetType: string; userId: EntityId; emoji: string }[] =
    [];

  #computedReactionCounts(): void {
    const byEmoji = groupByMapping(
      this.#reactions,
      (r) => r.emoji,
      (r) => ({ userId: r.userId, firstName: r.firstName, lastName: r.lastName }),
    );

    this.props.reactionCounts = {
      total: this.#reactions.length,
      byEmoji: Array.from(byEmoji, ([emoji, reactors]) => ({
        emoji: emoji.value,
        count: reactors.length,
        reactors,
      })),
    };
  }

  private constructor(actorId: ActorId, props: CommentProps, id?: EntityId) {
    super(id, actorId, 'comment');
    this.props = { ...props };
    this.#computedReactionCounts();
  }

  static create(input: CreateCommentInput, actorId: ActorId): Comment {
    const comment = new Comment(actorId, { ...input });
    comment.recordEvent(
      'commentPosted',
      {
        commentId: comment.id(),
        containerType: input.targetType,
        containerId: input.targetId,
        authorId: input.authorId,
        parentCommentId: input.parentCommentId,
        parentAuthorId: input.parentAuthorId,
      },
      actorId,
    );
    return comment;
  }

  static rehydrate(record: CommentRecord, childRecords: CommentChildRecords): Comment {
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

    comment.#reactions = [...(childRecords.reactions ?? [])];
    comment.#computedReactionCounts();
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

  targetType(): EnumSubset<EntityType, 'mediaItem'> {
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

  toggleReaction(item: Reaction, actorId: ActorId): WriteResult {
    const reaction = this.#reactions.find(
      (r) => r.emoji.equals(item.emoji) && r.userId === item.userId,
    );
    if (reaction) {
      this.#removedReactions.push({
        targetId: this.id(),
        targetType: EntityType.comment.value,
        userId: item.userId,
        emoji: item.emoji.value,
      });
      this.#reactions = this.#reactions.filter((r) => r.id !== reaction.id);
    } else {
      const newReaction = {
        ...item,
        id: crypto.randomUUID(),
        targetId: this.id(),
        targetType: EntityType.comment,
        updatedBy: actorId,
        updatedAt: new Date(),
      };
      this.#addedReactions.push(newReaction);
      this.#reactions.push(newReaction);
      this.recordEvent(
        'reactionAdded',
        {
          containerId: this.id(),
          containerType: EntityType.comment,
          reactionKind: item.emoji,
        },
        actorId,
      );
    }

    this.#computedReactionCounts();
    this.touch(actorId);
    return ok(undefined);
  }

  VOs(): Record<string, VOCollection> {
    return {
      reactions: {
        upsert: this.#addedReactions,
        removed: this.#removedReactions,
        conflictKeys: ['targetId', 'targetType', 'userId', 'emoji'],
        tableName: 'reaction',
      },
    };
  }
}
