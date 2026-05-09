import { CommentTargetType } from '@packages/contracts';

// CHANGED: Frontend View Models — VM type defines the UI-facing shape for a flat comment.
// Components consume CommentVM rather than raw CommentFieldsFragment wire types.
export type CommentVM = {
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
};
