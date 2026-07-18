import { EntityType } from '@packages/contracts';
import { JSX, useState } from 'react';
import styled from 'styled-components';
import { useUnseenActivity } from '../../hooks/useUnseenActivity';
import { useViewer } from '../../hooks/useViewer';
import { UnseenDot } from '../../ui/UnseenDot';
import { CommentReplyVM, CommentRootVM } from '../../viewModels/';
import { PublicReactionsContainer } from '../reactions/PublicReactionsContainer';
import { ReactionsContainer } from '../reactions/ReactionsContainer';
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
  const { isSourceUnseen } = useUnseenActivity();
  const authorId = viewer?.id;
  const [isEditing, setIsEditing] = useState(false);
  // Per-comment read-state: unseen rows get an UnseenDot badged on the avatar corner.
  // Same membership check used at every level — here matched on the comment SOURCE id.
  const isUnseen = isSourceUnseen(EntityType.comment, comment.id);
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
      <Root data-testid="comment-row">
        <DeletedAvatarPlaceholder $size={avatarSize} aria-hidden />
        <Content>
          <DeletedCommentPlaceholder />
        </Content>
      </Root>
    );
  }

  const inner = (
    <Root data-testid="comment-row">
      <AvatarWrap>
        <CommentAvatar
          comment={{ displayName: comment.displayName, displayAvatarUrl: comment.displayAvatarUrl }}
          size={avatarSize}
        />
        {isUnseen ? <UnseenDot size={9} top={-2} right={-2} /> : null}
      </AvatarWrap>
      <Content>
        <TopRow>
          <CommentHeader
            comment={{
              displayName: comment.displayName,
              createdAt: comment.createdAt,
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
          <ReactionsContainer
            targetId={comment.id}
            targetType={EntityType.comment}
            reactionCounts={comment.reactionCounts}
            viewerReactions={comment.viewerReactions}
            canReact
            onRefetch={onRefetchComments}
          />
        ) : (
          <PublicReactionsContainer reactionCounts={comment.reactionCounts} />
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

/** Anchors the unseen dot to the avatar corner (the row itself is not relative). */
const AvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
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
