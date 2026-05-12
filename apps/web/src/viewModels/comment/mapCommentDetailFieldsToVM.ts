import { type CommentDetailFieldsFragment } from '../../graphql/generated/types';
import { CommentRootVM } from './CommentRootVM';
import { mapCommentReplyFieldsToVM } from './mapCommentReplyFieldsToVM';

// CHANGED: Frontend View Models — mapper converts Root wire fragment → CommentRootVM.
// Handles the nested replies.nodes (offset/limit shape) and converts each reply to CommentVM.
export const mapCommentRootFieldsToVM = (fragment: CommentDetailFieldsFragment): CommentRootVM => ({
  id: fragment.id,
  targetType: fragment.targetType,
  targetId: fragment.targetId,
  parentCommentId: fragment.parentCommentId,
  authorId: fragment.authorId,
  body: fragment.body,
  displayName: fragment.displayName,
  displayAvatarUrl: fragment.displayAvatarUrl,
  isEdited: fragment.isEdited,
  isDeleted: fragment.isDeleted,
  createdAt: new Date(fragment.createdAt),
  updatedAt: new Date(fragment.updatedAt),
  replies: fragment.replies.map(mapCommentReplyFieldsToVM),
});

export const mapMultipleCommentRootFieldsToVMs = (
  fragments: CommentDetailFieldsFragment[],
): CommentRootVM[] => fragments.map(mapCommentRootFieldsToVM);
