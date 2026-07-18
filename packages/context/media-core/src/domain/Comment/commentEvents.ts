import { EntityType, ReactionEmoji } from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';
import { EntityId } from '../../types/types';
import { DomainEventBase } from '../domainEvents/DomainEvent';

export type CommentTargetType = EnumSubset<EntityType, 'mediaItem' | 'album'>;
export type CommentSourceType = EnumSubset<EntityType, 'mediaItem' | 'comment'>;
export interface CommentPosted extends DomainEventBase {
  kind: 'commentPosted';
  commentId: EntityId;
  targetType: CommentTargetType;
  targetId: EntityId;
  authorId: EntityId;
  parentCommentId?: EntityId;
  parentAuthorId?: EntityId;
}

export type ReactionTargetKind = EnumSubset<EntityType, 'comment' | 'mediaItem'>;
export interface ReactionAdded extends DomainEventBase {
  kind: 'reactionAdded';
  targetType: ReactionTargetKind;
  targetId: EntityId;
  reactionKind: ReactionEmoji;
}
