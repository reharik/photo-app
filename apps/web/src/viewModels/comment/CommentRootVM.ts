import { CommentTargetType, ReactionEmoji } from '@packages/contracts';

import { ReactionCountsVM } from '../reactions/ReactionCountsVM';
import { CommentReplyVM } from './CommentReplyVM';

// CHANGED: Frontend View Models — separate Detail VM that includes pre-fetched replies.
// Defined independently from CommentVM (no extension/inheritance) per convention.
export type CommentRootVM = {
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
  replies: CommentReplyVM[];
};
