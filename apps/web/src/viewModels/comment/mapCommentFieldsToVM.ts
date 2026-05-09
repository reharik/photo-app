import { type CommentFieldsFragment } from '../../graphql/generated/types';
import { CommentVM } from './CommentVM';

// CHANGED: Frontend View Models — mapper converts wire fragment → clean UI VM.
// Pure transformation; no data fetching.
export const mapCommentFieldsToVM = (fragment: CommentFieldsFragment): CommentVM => ({
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
});

export const mapMultipleCommentFieldsToVMs = (fragments: CommentFieldsFragment[]): CommentVM[] =>
  fragments.map(mapCommentFieldsToVM);
