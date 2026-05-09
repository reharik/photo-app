import { CommentTargetType } from '@packages/contracts';
import { CommentVM } from './CommentVM';

// CHANGED: Frontend View Models — separate Detail VM that includes pre-fetched replies.
// Defined independently from CommentVM (no extension/inheritance) per convention.
export type CommentDetailVM = {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  parentCommentId: string | null;
  authorUserId: string | null;
  body: string;
  displayName: string;
  displayAvatarUrl: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies: CommentVM[];
};
