import { EntityType, NotificationContainerType, ReactionEmoji } from '@packages/contracts';
import { EnumSubset } from '@reharik/smart-enum';
import { EntityId } from '../../types/types';
import { DomainEventBase } from '../domainEvents/DomainEvent';

export type CommentTargetType = EnumSubset<EntityType, 'mediaItem' | 'album'>;
export type CommentSourceType = EnumSubset<EntityType, 'mediaItem' | 'comment'>;
export interface CommentPosted extends DomainEventBase {
  kind: 'commentPosted';
  commentId: EntityId;
  containerType: CommentTargetType;
  containerId: EntityId;
  authorId: EntityId;
  parentCommentId?: EntityId;
  parentAuthorId?: EntityId;
}

export interface ReactionAdded extends DomainEventBase {
  kind: 'reactionAdded';
  containerType: NotificationContainerType;
  containerId: EntityId;
  reactionKind: ReactionEmoji;
}
