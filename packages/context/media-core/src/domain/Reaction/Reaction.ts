import type { ReactionTargetType } from '@packages/contracts';
import type { ActorId, EntityId } from '../../types/types';
import { AggregateRoot } from '../AggregateRoot';
import type { AuditRecord } from '../Entity';

export { ReactionTargetType } from '@packages/contracts';

export const SUPPORTED_REACTION_EMOJIS_V1 = ['❤️'] as const;

export type ReactionProps = {
  targetType: ReactionTargetType;
  targetId: EntityId;
  userId: EntityId;
  emoji: string;
};

export type ReactionRecord = {
  id: EntityId;
  targetType: ReactionTargetType;
  targetId: EntityId;
  userId: EntityId;
  emoji: string;
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
    emoji: string;
  }): Reaction {
    if (
      !SUPPORTED_REACTION_EMOJIS_V1.includes(
        input.emoji as (typeof SUPPORTED_REACTION_EMOJIS_V1)[number],
      )
    ) {
      throw new Error(
        `Emoji '${input.emoji}' is not supported in v1. Supported: ${SUPPORTED_REACTION_EMOJIS_V1.join(', ')}`,
      );
    }
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

  emoji(): string {
    return this.props.emoji;
  }

  toRecord(): ReactionRecord {
    return {
      id: this.id(),
      ...this.props,
      ...this.exportAudit(),
    };
  }
}
