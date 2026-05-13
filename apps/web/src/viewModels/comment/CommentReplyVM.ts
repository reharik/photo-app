import { CommentTargetType, ReactionEmoji } from '@packages/contracts';
import { ReactionCountsVM } from '../reactions/ReactionCountsVM';

export type CommentReplyVM = {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  parentCommentId?: string;
  authorId: string;
  body: string;
  displayName: string;
  displayAvatarUrl?: string;
  isEdited: boolean;
  isDeleted: boolean;
  reactionCounts: ReactionCountsVM;
  viewerReactions: ReactionEmoji[];
  createdAt: Date;
  updatedAt: Date;
};
