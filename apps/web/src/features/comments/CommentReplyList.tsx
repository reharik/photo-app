import { JSX } from 'react';
import styled from 'styled-components';
import { CommentRow } from './CommentRow';
import type { CommentsPanelComment } from './CommentsPanel';

type Props = {
  replies: CommentsPanelComment[];
  canComment: boolean;
  viewerUserId: string | null;
  onEditComment?: (commentId: string, body: string) => void;
  onDeleteComment?: (commentId: string) => void;
};

export const CommentReplyList = ({
  replies,
  canComment,
  viewerUserId,
  onEditComment,
  onDeleteComment,
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
          viewerUserId={viewerUserId}
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
