import styled from 'styled-components';
// CHANGED: Frontend View Models — components consume CommentDetailVM instead of raw fragment types.
import { type CommentDetailVM } from '../../viewModels/comment/CommentDetailVM';
import { CommentThread } from './CommentThread';

type Viewer = {
  userId: string | null;
  canComment: boolean;
};

type Props = {
  comments: CommentDetailVM[];
  viewer: Viewer;
  onAddReply: (parentCommentId: string, body: string) => Promise<void>;
  onEdit: (commentId: string, newBody: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  addReplyLoading: boolean;
};

const shouldRenderThread = (comment: CommentDetailVM): boolean => {
  if (!comment.isDeleted) return true;
  // CHANGED: Pagination — check replies.length (nodes array) instead of replies.totalCount
  // (cursor-style field that no longer exists in the offset/limit payload shape).
  return comment.replies.length > 0;
};

export const CommentList = ({
  comments,
  viewer,
  onAddReply,
  onEdit,
  onDelete,
  addReplyLoading,
}: Props) => (
  <Root>
    {comments.filter(shouldRenderThread).map((comment) => (
      <CommentThread
        key={comment.id}
        comment={comment}
        viewer={viewer}
        onAddReply={onAddReply}
        onEdit={onEdit}
        onDelete={onDelete}
        addReplyLoading={addReplyLoading}
      />
    ))}
  </Root>
);

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
`;
