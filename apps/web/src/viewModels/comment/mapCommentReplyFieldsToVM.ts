import { type CommentFieldsFragment } from '../../graphql/generated/types';
import { CommentReplyVM } from './CommentReplyVM';

// CHANGED: Frontend View Models — mapper converts wire fragment → clean UI VM.
// Pure transformation; no data fetching.
export const mapCommentReplyFieldsToVM = (fragment: CommentFieldsFragment): CommentReplyVM => ({
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
});

export const mapMultipleCommentReplyFieldsToVMs = (
  fragments: CommentFieldsFragment[],
): CommentReplyVM[] => fragments.map(mapCommentReplyFieldsToVM);
