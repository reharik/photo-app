import { useQuery } from '@apollo/client/react';
import { CommentTargetType } from '@packages/contracts';
import { type JSX, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../domain/errors/errorTypes';
import {
  AddCommentDocument,
  type AddCommentMutation,
  CommentsForViewerMediaItemDocument,
  DeleteCommentDocument,
  type DeleteCommentMutation,
  EditCommentDocument,
  type EditCommentMutation,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { AppErrorPanel } from '../../ui/AppErrorPanel';
import { CommentsPanel } from '../comments/CommentsPanel';
import {
  countVisiblePanelComments,
  groupCommentDetailFieldsToPanelComments,
} from '../comments/groupCommentDetailFieldsToPanelComments';

const PAGE_SIZE = 50;

export type CommentsForViewerMediaItemContainerProps = {
  mediaItemId: string;
  canComment: boolean;
};

export const CommentsForViewerMediaItemContainer = ({
  mediaItemId,
  canComment,
}: CommentsForViewerMediaItemContainerProps): JSX.Element => {
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const addMutation = useAppMutationState();
  const editMutation = useAppMutationState();
  const deleteMutation = useAppMutationState();

  const { data, loading, error, refetch } = useQuery(CommentsForViewerMediaItemDocument, {
    variables: { mediaItemId, limit: PAGE_SIZE, offset: 0 },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const rawNodes = data?.viewer?.mediaItem?.comments?.nodes;
  const comments = useMemo(
    () => groupCommentDetailFieldsToPanelComments(rawNodes ?? []),
    [rawNodes],
  );
  const count = countVisiblePanelComments(comments);
  const titleText = rawNodes != null ? `Comments · ${count}` : 'Comments';

  const viewerUserId = data?.viewer?.id ?? null;

  const err: Error | null =
    error != null ? (error instanceof Error ? error : new Error('Failed to load comments')) : null;

  const mutationErrors: AppError[] = useMemo(
    () => [...addMutation.errors, ...editMutation.errors, ...deleteMutation.errors],
    [addMutation.errors, editMutation.errors, deleteMutation.errors],
  );

  const handleAddComment = useCallback(
    async (body: string, parentCommentId: string | null): Promise<void> => {
      const result = await addMutation.execute(
        {
          mutation: AddCommentDocument,
          variables: {
            input: {
              body,
              parentCommentId: parentCommentId ?? undefined,
              targetType: CommentTargetType.mediaItem,
              targetId: mediaItemId,
            },
          },
        },
        (mutationData: AddCommentMutation) => mutationData.addComment,
      );
      if (result.success) {
        await refetch();
      }
    },
    [addMutation, mediaItemId, refetch],
  );

  const handleEditComment = useCallback(
    async (commentId: string, body: string): Promise<void> => {
      const result = await editMutation.execute(
        {
          mutation: EditCommentDocument,
          variables: {
            input: { commentId, body },
          },
        },
        (mutationData: EditCommentMutation) => mutationData.editComment,
      );
      if (result.success) {
        await refetch();
      }
    },
    [editMutation, refetch],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      setDeletingCommentId(commentId);
      try {
        const result = await deleteMutation.execute(
          {
            mutation: DeleteCommentDocument,
            variables: {
              input: { commentId },
            },
          },
          (mutationData: DeleteCommentMutation) => mutationData.deleteComment,
        );
        if (result.success) {
          await refetch();
        }
      } finally {
        setDeletingCommentId(null);
      }
    },
    [deleteMutation, refetch],
  );

  return (
    <Root>
      <SectionTitle>{titleText}</SectionTitle>
      <AppErrorPanel errors={mutationErrors} />
      <CommentsPanel
        comments={comments}
        loading={loading}
        error={err}
        canComment={canComment}
        viewerUserId={viewerUserId}
        onRetry={() => void refetch()}
        onAddComment={canComment ? handleAddComment : undefined}
        onEditComment={canComment ? handleEditComment : undefined}
        onDeleteComment={canComment ? handleDeleteComment : undefined}
        addCommentLoading={addMutation.isLoading}
        editCommentLoading={editMutation.isLoading}
        deletingCommentId={deletingCommentId}
      />
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
