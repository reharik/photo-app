import { useState } from 'react';
import styled from 'styled-components';
import type { CommentWithReplies } from './hooks/useCommentsForTarget';
import type { CommentFieldsFragment } from '../../graphql/generated/types';
import { CommentReplyList } from './CommentReplyList';
import { CommentRow } from './CommentRow';
import { ReplyComposer } from './ReplyComposer';

type Viewer = {
  userId: string | null;
  canComment: boolean;
};

type Props = {
  comment: CommentWithReplies;
  viewer: Viewer;
  onAddReply: (parentCommentId: string, body: string) => Promise<void>;
  onEdit: (commentId: string, newBody: string) => Promise<void>;
  onDelete: (comment: CommentFieldsFragment) => Promise<void>;
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

  const replies = comment.replies.edges.map((e) => e.node);

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
