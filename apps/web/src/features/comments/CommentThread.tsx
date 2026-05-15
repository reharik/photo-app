import { JSX, useState } from 'react';
import styled from 'styled-components';
import { CommentRootVM } from '../../viewModels/';
import { CommentReplyList } from './CommentReplyList';
import { CommentRow } from './CommentRow';
import { ReplyComposer } from './ReplyComposer';

type Props = {
  comment: CommentRootVM;
  canComment: boolean;
  onAddComment?: (body: string, parentCommentId?: string) => void;
  onEditComment?: (commentId: string, body: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onRefetchComments?: () => Promise<void>;
  addCommentLoading?: boolean;
  editCommentLoading?: boolean;
  deletingCommentId?: string;
};

export const CommentThread = ({
  comment,
  canComment,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onRefetchComments,
  addCommentLoading = false,
  editCommentLoading = false,
  deletingCommentId = undefined,
}: Props): JSX.Element => {
  const [replyOpen, setReplyOpen] = useState(false);
  const replies = comment.replies ?? [];

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
        editCommentLoading={editCommentLoading}
        deleteCommentPending={deletingCommentId === comment.id}
        onReply={
          canComment && onAddComment && comment.parentCommentId == null
            ? () => setReplyOpen(true)
            : undefined
        }
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
        onRefetchComments={onRefetchComments}
      />
      <CommentReplyList
        replies={replies}
        canComment={canComment}
        editCommentLoading={editCommentLoading}
        deletingCommentId={deletingCommentId}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
        onRefetchComments={onRefetchComments}
      />
      {showReplyComposer ? (
        <ReplyArea>
          <ReplyComposer
            onSubmit={(b) => void handleReplySubmit(b)}
            onCancel={() => setReplyOpen(false)}
            isLoading={addCommentLoading}
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
