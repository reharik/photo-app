import { JSX } from 'react';
import styled from 'styled-components';
import { AppError } from '../../domain/errors/errorTypes';
import { CommentRootVM } from '../../viewModels/';
import { CommentComposer } from './CommentComposer';
import { CommentThread } from './CommentThread';
import { CommentsEmptyState } from './CommentsEmptyState';
import { CommentsErrorState } from './CommentsErrorState';
import { CommentsLoadingState } from './CommentsLoadingState';

/** @deprecated Use CommentRootVM | CommentReplyVM directly from the viewModels. */
export type CommentsPanelComment = CommentRootVM;

export type CommentsPanelProps = {
  comments: CommentRootVM[];
  loading: boolean;
  error?: AppError[];
  canComment: boolean;
  onRetry?: () => void;
  onAddComment?: (body: string, parentCommentId?: string) => void;
  onEditComment?: (commentId: string, body: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onRefetchComments?: () => Promise<void>;
  addCommentLoading?: boolean;
  editCommentLoading?: boolean;
  deletingCommentId?: string;
};

const shouldRenderThread = (comment: CommentRootVM): boolean => {
  if (!comment.isDeleted) return true;
  return comment.replies.length > 0;
};

export const CommentsPanel = ({
  comments,
  loading,
  error,
  canComment,
  onRetry,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onRefetchComments,
  addCommentLoading = false,
  editCommentLoading = false,
  deletingCommentId = undefined,
}: CommentsPanelProps): JSX.Element => {
  const threads = comments.filter(shouldRenderThread);
  if (error && error.length > 0) {
    return <CommentsErrorState error={error[0]} onRetry={onRetry} />;
  }

  if (loading && threads.length === 0) {
    return <CommentsLoadingState />;
  }

  if (threads.length === 0) {
    return (
      <Root>
        {canComment && onAddComment ? (
          <CommentComposer
            isLoading={addCommentLoading}
            onSubmit={(body) => void Promise.resolve(onAddComment(body))}
          />
        ) : null}
        <CommentsEmptyState canComment={canComment} />
      </Root>
    );
  }

  return (
    <Root>
      {canComment && onAddComment ? (
        <CommentComposer
          isLoading={addCommentLoading}
          onSubmit={(body) => void Promise.resolve(onAddComment(body))}
        />
      ) : null}
      <ThreadList role="list">
        {threads.map((comment) => (
          <CommentThread
            key={comment.id}
            comment={comment}
            canComment={canComment}
            addCommentLoading={addCommentLoading}
            editCommentLoading={editCommentLoading}
            deletingCommentId={deletingCommentId}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onRefetchComments={onRefetchComments}
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
