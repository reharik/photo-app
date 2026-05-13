import { JSX, useState } from 'react';
import styled from 'styled-components';
import { PublicReactionsForCommentContainer } from '../../features/reactions/PublicReactionsForCommentContainer';
import { ReactionsForCommentContainer } from '../../features/reactions/ReactionsForCommentContainer';
import { useViewer } from '../../hooks/useViewer';
import { CommentReplyVM } from '../../viewModels/comment/CommentReplyVM';
import { CommentRootVM } from '../../viewModels/comment/CommentRootVM';
import { CommentActions, CommentActionsRevealWrapper } from './CommentActions';
import { CommentAvatar } from './CommentAvatar';
import { CommentBody } from './CommentBody';
import { CommentHeader } from './CommentHeader';
import { DeletedCommentPlaceholder } from './DeletedCommentPlaceholder';

type Props = {
  comment: CommentRootVM | CommentReplyVM;
  depth: number;
  canComment: boolean;
  onReply?: () => void;
  onEditComment?: (commentId: string, body: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onRefetchComments?: () => Promise<void>;
  /** True while edit mutation is running (only one editor expected at a time). */
  editCommentLoading?: boolean;
  /** True while delete mutation is running for this comment. */
  deleteCommentPending?: boolean;
};

export const CommentRow = ({
  comment,
  depth,
  canComment,
  onReply,
  onEditComment,
  onDeleteComment,
  onRefetchComments,
  editCommentLoading = false,
  deleteCommentPending = false,
}: Props): JSX.Element => {
  const { viewer } = useViewer();
  const authorId = viewer?.id;
  const [isEditing, setIsEditing] = useState(false);
  const avatarSize = depth > 0 ? 28 : 32;

  const isMine = authorId !== null && comment.authorId === authorId;
  const isTopLevel = comment.parentCommentId == null;
  const canReply = canComment && isTopLevel && !!onReply;
  const canEdit = isMine && !!onEditComment;
  const canDelete = isMine && !!onDeleteComment;

  const handleSave = async (newBody: string): Promise<void> => {
    if (onEditComment) await Promise.resolve(onEditComment(comment.id, newBody));
    setIsEditing(false);
  };

  if (comment.isDeleted) {
    return (
      <Root>
        <DeletedAvatarPlaceholder $size={avatarSize} aria-hidden />
        <Content>
          <DeletedCommentPlaceholder />
        </Content>
      </Root>
    );
  }

  const inner = (
    <Root>
      <CommentAvatar
        comment={{ displayName: comment.displayName, displayAvatarUrl: comment.displayAvatarUrl }}
        size={avatarSize}
      />
      <Content>
        <TopRow>
          <CommentHeader
            comment={{
              displayName: comment.displayName,
              createdAt:
                comment.createdAt instanceof Date
                  ? comment.createdAt.toISOString()
                  : comment.createdAt,
              isEdited: comment.isEdited,
            }}
          />
          <CommentActions
            canReply={canReply}
            canEdit={canEdit}
            canDelete={canDelete}
            interactionDisabled={deleteCommentPending}
            onReply={onReply}
            onEdit={onEditComment ? () => setIsEditing(true) : undefined}
            onDelete={onDeleteComment ? () => void onDeleteComment(comment.id) : undefined}
          />
        </TopRow>
        <CommentBody
          comment={{ body: comment.body }}
          isEditing={isEditing}
          isSaving={isEditing && editCommentLoading}
          onSave={onEditComment ? handleSave : undefined}
          onCancelEdit={onEditComment ? () => setIsEditing(false) : undefined}
        />
        {onRefetchComments ? (
          <ReactionsForCommentContainer
            commentId={comment.id}
            reactionCount={comment.reactionCount}
            viewerHasReacted={comment.viewerHasReacted}
            canReact
            onRefetch={onRefetchComments}
          />
        ) : (
          <PublicReactionsForCommentContainer reactionCount={comment.reactionCount} />
        )}
      </Content>
    </Root>
  );

  if (canReply || canEdit || canDelete) {
    return <CommentActionsRevealWrapper>{inner}</CommentActionsRevealWrapper>;
  }

  return inner;
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

const DeletedAvatarPlaceholder = styled.div<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.bodyElevated};
  flex-shrink: 0;
`;
