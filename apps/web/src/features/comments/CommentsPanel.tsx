import { JSX } from 'react';
import styled from 'styled-components';
import { AppError } from '../../domain/errors/errorTypes';
import { CommentRootVM } from '../../viewModels/';
import { CommentComposer } from './CommentComposer';
import { CommentThread } from './CommentThread';
import { CommentsEmptyHint } from './CommentsEmptyHint';
import { CommentsEmptyState } from './CommentsEmptyState';
import { CommentsErrorState } from './CommentsErrorState';
import { CommentsLoadingState } from './CommentsLoadingState';

/** @deprecated Use CommentRootVM | CommentReplyVM directly from the viewModels. */
export type CommentsPanelComment = CommentRootVM;

export type CommentsPanelLayout = 'default' | 'rail';

export type CommentsPanelProps = {
  comments: CommentRootVM[];
  loading: boolean;
  error?: AppError[];
  canComment: boolean;
  layout?: CommentsPanelLayout;
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
  layout = 'default',
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
  const isRail = layout === 'rail';
  const queryError = error?.[0];
  const showComposer = canComment && onAddComment != null;

  if (!isRail) {
    if (queryError != null) {
      return <CommentsErrorState error={queryError} onRetry={onRetry} />;
    }

    if (loading && threads.length === 0) {
      return <CommentsLoadingState />;
    }

    if (threads.length === 0) {
      return (
        <Root>
          {showComposer ? (
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
        {showComposer ? (
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
  }

  return (
    <Root>
      {showComposer ? (
        <CommentComposer
          isLoading={addCommentLoading}
          onSubmit={(body) => void Promise.resolve(onAddComment(body))}
        />
      ) : null}
      {queryError != null ? <CommentsErrorState error={queryError} onRetry={onRetry} /> : null}
      {loading && threads.length === 0 ? <CommentsLoadingState /> : null}
      {!loading && threads.length === 0 && canComment ? <CommentsEmptyHint /> : null}
      {threads.length > 0 ? (
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
      ) : null}
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
