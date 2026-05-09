import { type CommentDetailFieldsFragment } from '../../graphql/generated/types';
import { CommentDetailVM } from './CommentDetailVM';
import { mapCommentFieldsToVM } from './mapCommentFieldsToVM';

// CHANGED: Frontend View Models — mapper converts detail wire fragment → CommentDetailVM.
// Handles the nested replies.nodes (offset/limit shape) and converts each reply to CommentVM.
export const mapCommentDetailFieldsToVM = (
  fragment: CommentDetailFieldsFragment,
): CommentDetailVM => ({
  id: fragment.id,
  targetType: fragment.targetType,
  targetId: fragment.targetId,
  parentCommentId: fragment.parentCommentId ?? null,
  authorUserId: fragment.authorUserId ?? null,
  body: fragment.body,
  displayName: fragment.displayName,
  displayAvatarUrl: fragment.displayAvatarUrl ?? null,
  isEdited: fragment.isEdited,
  isDeleted: fragment.isDeleted,
  createdAt: new Date(fragment.createdAt),
  updatedAt: new Date(fragment.updatedAt),
  // CHANGED: Pagination — reads nodes[] from offset/limit payload (not edges[].node from cursor shape).
  replies: (fragment.replies.nodes ?? []).map(mapCommentFieldsToVM),
});

export const mapMultipleCommentDetailFieldsToVMs = (
  fragments: CommentDetailFieldsFragment[],
): CommentDetailVM[] => fragments.map(mapCommentDetailFieldsToVM);
