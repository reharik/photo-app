import { type CommentDetailFieldsFragment } from '../../graphql/generated/types';
import { mapReactionCountsToVM } from '../reactions/mapReactionCountsToVM';
import { CommentRootVM } from './CommentRootVM';
import { mapCommentRepliesToVM } from './mapCommentRepliesToVM';

// CHANGED: Frontend View Models — mapper converts Root wire fragment → CommentRootVM.
// Handles the nested replies.nodes (offset/limit shape) and converts each reply to CommentVM.
export const mapCommentRootsToVM = (fragment: CommentDetailFieldsFragment): CommentRootVM => ({
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
  reactionCounts: mapReactionCountsToVM(fragment.reactionCounts),
  viewerReactions: fragment.viewerReactions,
  createdAt: new Date(fragment.createdAt),
  updatedAt: new Date(fragment.updatedAt),
  replies: fragment.replies.map(mapCommentRepliesToVM),
});

export const mapMultipleCommentRootsToVMs = (
  fragments: CommentDetailFieldsFragment[],
): CommentRootVM[] => fragments.map(mapCommentRootsToVM);
