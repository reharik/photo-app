import { useState } from 'react';
import styled from 'styled-components';
// CHANGED: Frontend View Models — CommentRow takes CommentVM (UI-facing type) instead of
// CommentFieldsFragment (wire type). Single-purpose component, so VM is passed directly
// rather than a structural prop type (per convention exception for single-purpose components).
import { type CommentVM } from '../../viewModels/comment/CommentVM';
import { CommentActionsRevealWrapper, CommentActions } from './CommentActions';
import { CommentAvatar } from './CommentAvatar';
import { CommentBody } from './CommentBody';
import { CommentHeader } from './CommentHeader';
import { DeletedCommentPlaceholder } from './states/DeletedCommentPlaceholder';

type Viewer = {
  userId: string | null;
  canComment: boolean;
};

type Props = {
  comment: CommentVM;
  viewer: Viewer;
  onReply?: () => void;
  onEdit: (commentId: string, newBody: string) => Promise<void>;
  // CHANGED: Mutation Responses — onDelete receives only commentId; the handler no longer
  // needs the full comment object since the mutation hook builds its own optimistic response.
  onDelete: (commentId: string) => Promise<void>;
};

export const CommentRow = ({ comment, viewer, onReply, onEdit, onDelete }: Props) => {
  const [isEditing, setIsEditing] = useState(false);

  const isMine = viewer.userId !== null && comment.authorUserId === viewer.userId;
  const isTopLevel = !comment.parentCommentId;
  const canReply = viewer.canComment && isTopLevel && !!onReply;
  const canEdit = isMine;
  const canDelete = isMine;

  const handleSave = async (newBody: string) => {
    await onEdit(comment.id, newBody);
    setIsEditing(false);
  };

  if (comment.isDeleted) {
    return (
      <Root>
        <DeletedAvatarPlaceholder aria-hidden />
        <Content>
          <DeletedCommentPlaceholder />
        </Content>
      </Root>
    );
  }

  return (
    <CommentActionsRevealWrapper>
      <Root>
        <CommentAvatar
          displayName={comment.displayName}
          displayAvatarUrl={comment.displayAvatarUrl}
          size={32}
        />
        <Content>
          <TopRow>
            <CommentHeader
              displayName={comment.displayName}
              createdAt={comment.createdAt}
              isEdited={comment.isEdited}
            />
            <CommentActions
              canReply={canReply}
              canEdit={canEdit}
              canDelete={canDelete}
              onReply={() => onReply?.()}
              onEdit={() => setIsEditing(true)}
              onDelete={() => void onDelete(comment.id)}
            />
          </TopRow>
          <CommentBody
            body={comment.body}
            isEditing={isEditing}
            onSave={handleSave}
            onCancelEdit={() => setIsEditing(false)}
          />
        </Content>
      </Root>
    </CommentActionsRevealWrapper>
  );
};

const Root = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  align-items: flex-start;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

const DeletedAvatarPlaceholder = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.bodyElevated};
  flex-shrink: 0;
`;
