import { CommentTargetType } from '@packages/contracts';
import styled from 'styled-components';
import type { CommentFieldsFragment } from '../../graphql/generated/types';
import { CommentComposer } from './CommentComposer';
import { CommentList } from './CommentList';
import { useAddComment } from './hooks/useAddComment';
import { useCommentsForTarget } from './hooks/useCommentsForTarget';
import { useDeleteComment } from './hooks/useDeleteComment';
import { useEditComment } from './hooks/useEditComment';
import { CommentEmptyState } from './states/CommentEmptyState';
import { CommentErrorState } from './states/CommentErrorState';
import { CommentLoadingState } from './states/CommentLoadingState';

type Viewer = {
  userId: string | null;
  canComment: boolean;
};

type Props = {
  targetType: CommentTargetType;
  targetId: string;
  viewer: Viewer;
  isPublicAccess?: boolean;
};

export const CommentSection = ({
  targetType,
  targetId,
  viewer,
  isPublicAccess = false,
}: Props) => {
  const { comments, loading, error, refetch } = useCommentsForTarget({
    targetType,
    targetId,
    isPublicAccess,
  });

  const { addComment, loading: addLoading } = useAddComment({
    targetType,
    targetId,
    isPublicAccess,
  });

  const { editComment } = useEditComment();
  const { deleteComment } = useDeleteComment();

  const handleAddComment = async (body: string) => {
    await addComment({ body, targetType, targetId });
  };

  const handleAddReply = async (parentCommentId: string, body: string) => {
    await addComment({ body, parentCommentId });
  };

  const handleEdit = async (commentId: string, newBody: string) => {
    const existing = findComment(comments, commentId);
    if (!existing) return;
    await editComment({ commentId, body: newBody }, existing);
  };

  const handleDelete = async (comment: CommentFieldsFragment) => {
    await deleteComment({ commentId: comment.id }, comment);
  };

  return (
    <Root>
      <Title>Comments</Title>

      {viewer.canComment && (
        <CommentComposer onSubmit={handleAddComment} isLoading={addLoading} />
      )}

      {loading && <CommentLoadingState />}
      {!loading && error && <CommentErrorState onRetry={() => void refetch()} />}
      {!loading && !error && comments.length === 0 && <CommentEmptyState />}
      {!loading && !error && comments.length > 0 && (
        <CommentList
          comments={comments}
          viewer={viewer}
          onAddReply={handleAddReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addReplyLoading={addLoading}
        />
      )}
    </Root>
  );
};

const findComment = (
  comments: Parameters<typeof CommentList>[0]['comments'],
  id: string,
): CommentFieldsFragment | undefined => {
  for (const thread of comments) {
    if (thread.id === id) return thread;
    const reply = thread.replies.edges.find((e) => e.node.id === id);
    if (reply) return reply.node;
  }
  return undefined;
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)} 0;
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.semi};
  color: ${({ theme }) => theme.color.bodyText};
`;
