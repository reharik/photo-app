import { useQuery } from '@apollo/client/react';
import { EntityType } from '@packages/contracts';
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
import { getQueryRenderState } from '../../hooks/getQueryRenderState';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { AppErrorPanel } from '../../ui/AppErrorPanel';
import { CommentsPanel, type CommentsPanelLayout } from '../comments/CommentsPanel';

const PAGE_SIZE = 50;

export type CommentsForViewerMediaItemContainerProps = {
  mediaItemId: string;
  canComment: boolean;
  layout?: CommentsPanelLayout;
};

export const CommentsForViewerMediaItemContainer = ({
  mediaItemId,
  canComment,
  layout = 'default',
}: CommentsForViewerMediaItemContainerProps): JSX.Element => {
  const [deletingCommentId, setDeletingCommentId] = useState<string | undefined>(undefined);

  const addMutation = useAppMutationState();
  const editMutation = useAppMutationState();
  const deleteMutation = useAppMutationState();

  const query = useQuery(CommentsForViewerMediaItemDocument, {
    variables: { mediaItemId, limit: PAGE_SIZE, offset: 0 },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data, content } = getQueryRenderState({
    query,
    select: (data) => ({
      nodes: data.viewer?.mediaItem?.comments?.nodes ?? [],
      totalCount: data.viewer?.mediaItem?.comments?.totalCount ?? 0,
    }),
  });

  const comments = data?.nodes ?? [];

  const mutationErrors: AppError[] = useMemo(
    () => [...addMutation.errors, ...editMutation.errors, ...deleteMutation.errors],
    [addMutation.errors, editMutation.errors, deleteMutation.errors],
  );

  const handleAddComment = useCallback(
    async (body: string, parentCommentId?: string): Promise<void> => {
      const result = await addMutation.execute(
        {
          mutation: AddCommentDocument,
          variables: {
            input: {
              body,
              parentCommentId,
              targetType: EntityType.mediaItem,
              targetId: mediaItemId,
            },
          },
        },
        (mutationData: AddCommentMutation) => mutationData.addComment,
      );
      if (result.success) {
        await query.refetch();
      }
    },
    [addMutation, mediaItemId, query],
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
        await query.refetch();
      }
    },
    [editMutation, query],
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
          await query.refetch();
        }
      } finally {
        setDeletingCommentId(undefined);
      }
    },
    [deleteMutation, query],
  );
  if (!comments) {
    return <>{content}</>;
  }
  return (
    <Root>
      {layout === 'default' ? <AppErrorPanel errors={mutationErrors} /> : null}
      <CommentsPanel
        comments={comments}
        loading={query.loading}
        error={mutationErrors}
        canComment={canComment}
        layout={layout}
        onRetry={() => void query.refetch()}
        onAddComment={canComment ? handleAddComment : undefined}
        onEditComment={canComment ? handleEditComment : undefined}
        onDeleteComment={canComment ? handleDeleteComment : undefined}
        onRefetchComments={async () => {
          await query.refetch();
        }}
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
