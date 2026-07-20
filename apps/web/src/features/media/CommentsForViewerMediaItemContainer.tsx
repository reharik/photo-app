import { useApolloClient, useQuery } from '@apollo/client/react';
import { EntityType } from '@packages/contracts';
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  MarkItemsSeenDocument,
  ViewerInAppNotificationDocument,
} from '../../graphql/generated/types';
import { getQueryRenderState } from '../../hooks/getQueryRenderState';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { useInAppNotification } from '../../hooks/useInAppNotification';
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

  // Deferred, id-scoped comment clear. The comment surface shows per-comment read-state
  // (bold vs medium), so we clear by the SPECIFIC unseen-row ids the client holds — not
  // a blanket target clear — which protects comments that arrived after the array loaded
  // (they aren't in the set, so they stay bold next session). Fires on CONSUME, not open:
  //   - mobile: the BottomSheet unmounts this container on close → cleanup runs
  //   - desktop: the always-visible rail unmounts (or mediaItemId changes) when you leave
  //     the photo → cleanup runs. Either way weight stays visible the whole time it's open.
  const apolloClient = useApolloClient();
  const { rows: unseenRows } = useInAppNotification();
  const unseenRowsRef = useRef(unseenRows);
  unseenRowsRef.current = unseenRows;

  useEffect(() => {
    // --- React.StrictMode workaround (dev only; harmless in prod) ---
    // The deferred comment clear must fire on UNMOUNT (leaving the photo / closing the
    // sheet) — that's what makes it "deferred until consumed" and lets the dot stay
    // visible while you read. But in development React.StrictMode intentionally
    // double-invokes every effect: mount → run cleanup → mount again. That extra
    // *synthetic* cleanup runs synchronously right after mount, which would fire
    // markItemsSeen the instant the thread opens — deleting the unseen row before the
    // dot is ever seen (exactly the "cleared on open" bug we hit).
    //
    // Fix: arm the clear on a macrotask (setTimeout 0). The synthetic cleanup runs
    // before the timer, sees `armed === false`, and skips; only a real later unmount —
    // by which point the timer has set `armed = true` — actually performs the clear.
    // In production (no StrictMode double-invoke) it simply arms once and fires on the
    // single real unmount.
    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 0);

    return () => {
      clearTimeout(armTimer);
      if (!armed) {
        return;
      }
      const ids = unseenRowsRef.current
        .filter(
          (row) =>
            row.containerType.equals(EntityType.mediaItem) &&
            row.containerId === mediaItemId &&
            row.subjectType.equals(EntityType.comment),
        )
        .map((row) => row.id);
      if (ids.length === 0) {
        return;
      }
      void apolloClient
        .mutate({ mutation: MarkItemsSeenDocument, variables: { ids } })
        .then(() => apolloClient.refetchQueries({ include: [ViewerInAppNotificationDocument] }))
        .catch((error) => console.error('markItemsSeen failed for comments', mediaItemId, error));
    };
  }, [mediaItemId, apolloClient]);

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
