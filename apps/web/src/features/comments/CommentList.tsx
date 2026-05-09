import styled from 'styled-components';
import type { CommentWithReplies } from './hooks/useCommentsForTarget';
import type { CommentFieldsFragment } from '../../graphql/generated/types';
import { CommentThread } from './CommentThread';

type Viewer = {
  userId: string | null;
  canComment: boolean;
};

type Props = {
  comments: CommentWithReplies[];
  viewer: Viewer;
  onAddReply: (parentCommentId: string, body: string) => Promise<void>;
  onEdit: (commentId: string, newBody: string) => Promise<void>;
  onDelete: (comment: CommentFieldsFragment) => Promise<void>;
  addReplyLoading: boolean;
};

const shouldRenderThread = (comment: CommentWithReplies): boolean => {
  if (!comment.isDeleted) return true;
  return comment.replies.totalCount > 0;
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
