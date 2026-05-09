import { useState } from 'react';
import styled from 'styled-components';
// CHANGED: Frontend View Models — components consume VM types instead of raw fragment types.
import { type CommentDetailVM } from '../../viewModels/comment/CommentDetailVM';
import { type CommentVM } from '../../viewModels/comment/CommentVM';
import { CommentReplyList } from './CommentReplyList';
import { CommentRow } from './CommentRow';
import { ReplyComposer } from './ReplyComposer';

type Viewer = {
  userId: string | null;
  canComment: boolean;
};

type Props = {
  comment: CommentDetailVM;
  viewer: Viewer;
  onAddReply: (parentCommentId: string, body: string) => Promise<void>;
  onEdit: (commentId: string, newBody: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  addReplyLoading: boolean;
};

export const CommentThread = ({
  comment,
  viewer,
  onAddReply,
  onEdit,
  onDelete,
  addReplyLoading,
}: Props) => {
  const [replyOpen, setReplyOpen] = useState(false);

  // CHANGED: Pagination — replies is now CommentVM[] (from VM), not edges[].node (cursor shape).
  const replies: CommentVM[] = comment.replies;

  const handleReplySubmit = async (body: string) => {
    await onAddReply(comment.id, body);
    setReplyOpen(false);
  };

  return (
    <Root>
      <CommentRow
        comment={comment}
        viewer={viewer}
        onReply={viewer.canComment ? () => setReplyOpen(true) : undefined}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <CommentReplyList replies={replies} viewer={viewer} onEdit={onEdit} onDelete={onDelete} />
      {replyOpen && (
        <ReplyArea>
          <ReplyComposer
            onSubmit={handleReplySubmit}
            onCancel={() => setReplyOpen(false)}
            isLoading={addReplyLoading}
          />
        </ReplyArea>
      )}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
`;

const ReplyArea = styled.div`
  padding-left: ${({ theme }) => theme.spacing(5)};
`;
