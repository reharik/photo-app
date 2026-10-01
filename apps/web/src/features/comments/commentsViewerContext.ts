import { createContext, useContext } from 'react';

export type CommentsViewer = {
  /** The signed-in viewer's id, or undefined on a public (anonymous) comment list. */
  viewerId: string | undefined;
  /** True when the comment is unseen activity for the viewer; always false on public lists. */
  isCommentUnseen: (commentId: string) => boolean;
};

/**
 * What a comment row needs to know about who is reading: whose comments are "mine", and
 * which are unseen. The CONTAINER that renders the comment list provides it, because only
 * the container knows whether it sits on a signed-in or a public page.
 *
 * Rows must not fetch this themselves: `Viewer` / `ViewerInAppNotification` are authenticated
 * queries, and on an anonymous public page the API rejects them ("Invalid access mode").
 */
export const CommentsViewerContext = createContext<CommentsViewer | undefined>(undefined);

/** The viewer for a public comment list: nobody, and nothing unseen. */
export const PUBLIC_COMMENTS_VIEWER: CommentsViewer = {
  viewerId: undefined,
  isCommentUnseen: () => false,
};

export const useCommentsViewer = (): CommentsViewer => {
  const value = useContext(CommentsViewerContext);
  if (value === undefined) {
    throw new Error('Comment rows must be rendered inside a CommentsViewerContext provider');
  }
  return value;
};
