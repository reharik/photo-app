import type { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import type { AuditRecord } from '../Entity';

export { ReactionTargetType } from '@packages/contracts';

export type ReactionProps = {
  targetType: ReactionTargetType;
  targetId: EntityId;
  userId: EntityId;
  emoji: ReactionEmoji;
};

export type ReactionRecord = {
  id: EntityId;
  targetType: ReactionTargetType;
  targetId: EntityId;
  userId: EntityId;
  emoji: ReactionEmoji;
} & AuditRecord;

export class Reaction extends AggregateRoot<ReactionRecord> {
  protected props: ReactionProps;

  private constructor(id: EntityId, actorId: ActorId, props: ReactionProps) {
    super(id, actorId);
    this.props = { ...props };
  }

  static create(input: {
    targetType: ReactionTargetType;
    targetId: EntityId;
    userId: EntityId;
    emoji: ReactionEmoji;
  }): Reaction {
    return new Reaction(crypto.randomUUID(), input.userId, {
      targetType: input.targetType,
      targetId: input.targetId,
      userId: input.userId,
      emoji: input.emoji,
    });
  }

  static rehydrate(record: ReactionRecord): Reaction {
    const { id, createdAt, updatedAt, createdBy, updatedBy, ...props } = record;
    const reaction = new Reaction(id, createdBy, props);
    reaction.rehydrateAudit({ createdAt, updatedAt, createdBy, updatedBy });
    return reaction;
  }

  targetType(): ReactionTargetType {
    return this.props.targetType;
  }

  targetId(): EntityId {
    return this.props.targetId;
  }

  userId(): EntityId {
    return this.props.userId;
  }

  emoji(): ReactionEmoji {
    return this.props.emoji;
  }
}
