import { JSX } from 'react';
import styled from 'styled-components';
import { CommentComposer } from './CommentComposer';
import { CommentThread } from './CommentThread';
import { CommentsEmptyState } from './CommentsEmptyState';
import { CommentsErrorState } from './CommentsErrorState';
import { CommentsLoadingState } from './CommentsLoadingState';

export type CommentsPanelComment = {
  id: string;
  body: string;
  authorUserId: string | null;
  displayName: string;
  displayAvatarUrl: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  /** ISO string; subcomponents format for display */
  createdAt: string;
  parentCommentId: string | null;
  replies: CommentsPanelComment[];
};

export type CommentsPanelProps = {
  comments: CommentsPanelComment[];
  loading: boolean;
  error: Error | null;
  canComment: boolean;
  viewerUserId: string | null;
  onRetry?: () => void;
  onAddComment?: (body: string, parentCommentId: string | null) => void;
  onEditComment?: (commentId: string, body: string) => void;
  onDeleteComment?: (commentId: string) => void;
};

const shouldRenderThread = (comment: CommentsPanelComment): boolean => {
  if (!comment.isDeleted) return true;
  return comment.replies.length > 0;
};

export const CommentsPanel = ({
  comments,
  loading,
  error,
  canComment,
  viewerUserId,
  onRetry,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: CommentsPanelProps): JSX.Element => {
  const threads = comments.filter(shouldRenderThread);

  if (error) {
    return <CommentsErrorState error={error} onRetry={onRetry} />;
  }

  if (loading && threads.length === 0) {
    return <CommentsLoadingState />;
  }

  if (threads.length === 0) {
    return (
      <Root>
        {canComment && onAddComment ? (
          <CommentComposer onSubmit={(body) => void Promise.resolve(onAddComment(body, null))} />
        ) : null}
        <CommentsEmptyState canComment={canComment} />
      </Root>
    );
  }

  return (
    <Root>
      {canComment && onAddComment ? (
        <CommentComposer onSubmit={(body) => void Promise.resolve(onAddComment(body, null))} />
      ) : null}
      <ThreadList role="list">
        {threads.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            canComment={canComment}
            viewerUserId={viewerUserId}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
          />
        ))}
      </ThreadList>
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const ThreadList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;
