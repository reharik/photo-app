import type {
  CommentDetailFieldsFragment,
  CommentFieldsFragment,
} from '../../graphql/generated/types';
import type { CommentsPanelComment } from './CommentsPanel';

export const mapCommentFieldsToPanelComment = (
  fragment: CommentFieldsFragment,
): CommentsPanelComment => ({
  id: fragment.id,
  body: fragment.body,
  authorUserId: fragment.authorUserId ?? null,
  displayName: fragment.displayName,
  displayAvatarUrl: fragment.displayAvatarUrl ?? null,
  isEdited: fragment.isEdited,

  isDeleted: fragment.isDeleted,
  createdAt: fragment.createdAt,
  parentCommentId: fragment.parentCommentId ?? null,
  replies: [],
});

const mapDetailToPanelShallow = (detail: CommentDetailFieldsFragment): CommentsPanelComment => ({
  id: detail.id,
  body: detail.body,
  authorUserId: detail.authorUserId ?? null,
  displayName: detail.displayName,
  displayAvatarUrl: detail.displayAvatarUrl ?? null,
  isEdited: detail.isEdited,
  isDeleted: detail.isDeleted,
  createdAt: detail.createdAt,
  parentCommentId: detail.parentCommentId ?? null,
  replies: [],
});

/** Builds top-level threads with nested replies from list query nodes (and nested reply payloads). */
export const groupCommentDetailFieldsToPanelComments = (
  nodes: CommentDetailFieldsFragment[],
): CommentsPanelComment[] => {
  const topLevel = nodes.filter((n) => n.parentCommentId == null);

  const mergeRepliesFor = (thread: CommentDetailFieldsFragment): CommentsPanelComment[] => {
    const fromNested = (thread.replies?.nodes ?? []).map(mapCommentFieldsToPanelComment);
    const seen = new Set(fromNested.map((r) => r.id));
    const fromFlat = nodes
      .filter((n) => n.parentCommentId === thread.id)
      .map((n) => mapDetailToPanelShallow(n));
    for (const r of fromFlat) {
      if (!seen.has(r.id)) {
        fromNested.push(r);
        seen.add(r.id);
      }
    }
    fromNested.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return fromNested;
  };

  return topLevel.map((t) => ({
    ...mapDetailToPanelShallow(t),
    replies: mergeRepliesFor(t),
  }));
};

export const countVisiblePanelComments = (comments: CommentsPanelComment[]): number => {
  let n = 0;
  for (const c of comments) {
    if (!c.isDeleted) {
      n += 1;
    } else if (c.replies.length > 0) {
      n += 1;
    }
    for (const r of c.replies) {
      if (!r.isDeleted) n += 1;
    }
  }
  return n;
};
