import { JSX } from 'react';
import styled from 'styled-components';
import { CommentRow } from './CommentRow';
import type { CommentsPanelComment } from './CommentsPanel';

type Props = {
  replies: CommentsPanelComment[];
  canComment: boolean;
  onEditComment?: (commentId: string, body: string) => void;
  onDeleteComment?: (commentId: string) => void;
  editCommentLoading?: boolean;
  deletingCommentId?: string | null;
};

export const CommentReplyList = ({
  replies,
  canComment,
  onEditComment,
  onDeleteComment,
  editCommentLoading = false,
  deletingCommentId = null,
}: Props): JSX.Element | null => {
  const visible = replies.filter((r) => !r.isDeleted);
  if (visible.length === 0) return null;

  return (
    <Root>
      {visible.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          depth={1}
          canComment={canComment}
          editCommentLoading={editCommentLoading}
          deleteCommentPending={deletingCommentId === reply.id}
          onEditComment={onEditComment}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  padding-left: ${({ theme }) => theme.spacing(4)};
  border-left: 2px solid ${({ theme }) => theme.color.border};
`;
