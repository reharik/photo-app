import { CommentTargetType } from '@packages/contracts';
import styled from 'styled-components';
import { mapMultipleCommentDetailFieldsToCommentDetailVMs } from '../../viewModels/comment/mapCommentDetailFieldsToCommentDetailVM';
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
  const { comments: rawComments, loading, error, refetch } = useCommentsForTarget({
    targetType,
    targetId,
    isPublicAccess,
  });

  // CHANGED: Frontend View Models — mapping happens at the screen level (data boundary),
  // converting raw fragments to VMs before passing to presentational components.
  const comments = mapMultipleCommentDetailFieldsToCommentDetailVMs(rawComments);

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
    await editComment({ commentId, body: newBody });
  };

  // CHANGED: Mutation Responses — handleDelete now receives only commentId since the mutation
  // hook no longer requires the full existing entity for its optimistic response.
  const handleDelete = async (commentId: string) => {
    await deleteComment({ commentId });
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
