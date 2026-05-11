import { JSX, useState } from 'react';
import styled from 'styled-components';
import { CommentReplyList } from './CommentReplyList';
import { CommentRow } from './CommentRow';
import type { CommentsPanelComment } from './CommentsPanel';
import { ReplyComposer } from './ReplyComposer';

type Props = {
  comment: CommentsPanelComment;
  canComment: boolean;
  viewerUserId: string | null;
  onAddComment?: (body: string, parentCommentId: string | null) => void;
  onEditComment?: (commentId: string, body: string) => void;
  onDeleteComment?: (commentId: string) => void;
};

export const CommentThread = ({
  comment,
  canComment,
  viewerUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: Props): JSX.Element => {
  const [replyOpen, setReplyOpen] = useState(false);
  const replies = comment.replies;

  const handleReplySubmit = async (body: string): Promise<void> => {
    if (onAddComment) await Promise.resolve(onAddComment(body, comment.id));
    setReplyOpen(false);
  };

  const showReplyComposer = canComment && !!onAddComment && replyOpen;

  return (
    <Root>
      <CommentRow
        comment={comment}
        depth={0}
        canComment={canComment}
        viewerUserId={viewerUserId}
        onReply={
          canComment && onAddComment && comment.parentCommentId == null
            ? () => setReplyOpen(true)
            : undefined
        }
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />
      <CommentReplyList
        replies={replies}
        canComment={canComment}
        viewerUserId={viewerUserId}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
      />
      {showReplyComposer ? (
        <ReplyArea>
          <ReplyComposer
            onSubmit={(b) => void handleReplySubmit(b)}
            onCancel={() => setReplyOpen(false)}
            isLoading={false}
          />
        </ReplyArea>
      ) : null}
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
