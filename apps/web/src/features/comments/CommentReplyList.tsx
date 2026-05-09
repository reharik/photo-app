import styled from 'styled-components';
// CHANGED: Frontend View Models — takes CommentVM[] instead of CommentFieldsFragment[].
import { type CommentVM } from '../../viewModels/comment/CommentVM';
import { CommentRow } from './CommentRow';

type Viewer = {
  userId: string | null;
  canComment: boolean;
};

type Props = {
  replies: CommentVM[];
  viewer: Viewer;
  onEdit: (commentId: string, newBody: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
};

export const CommentReplyList = ({ replies, viewer, onEdit, onDelete }: Props) => {
  const visibleReplies = replies.filter((r) => !r.isDeleted);
  if (visibleReplies.length === 0) return null;

  return (
    <Root>
      {visibleReplies.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          viewer={viewer}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding-left: ${({ theme }) => theme.spacing(5)};
  border-left: 2px solid ${({ theme }) => theme.color.border};
  margin-top: ${({ theme }) => theme.spacing(1.5)};
`;
