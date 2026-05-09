import { useMutation } from '@apollo/client/react';
import { CommentTargetType } from '@packages/contracts';
import { useViewer } from '../../../hooks/useViewer';
import {
  AddCommentDocument,
  CommentFieldsFragmentDoc,
  type AddCommentInput,
} from '../../../graphql/generated/types';

type Args = {
  targetType: CommentTargetType;
  targetId: string;
  isPublicAccess: boolean;
};

export type UseAddCommentResult = {
  addComment: (input: AddCommentInput) => Promise<void>;
  loading: boolean;
};

const parentTypename = (targetType: CommentTargetType, isPublicAccess: boolean): string => {
  if (targetType === CommentTargetType.mediaItem) {
    return isPublicAccess ? 'PublicMediaItem' : 'MediaItem';
  }
  return isPublicAccess ? 'PublicAlbum' : 'Album';
};

export const useAddComment = ({
  targetType,
  targetId,
  isPublicAccess,
}: Args): UseAddCommentResult => {
  const { viewer } = useViewer();

  const [mutate, { loading }] = useMutation(AddCommentDocument, {
    optimisticResponse: (vars) => ({
      addComment: {
        __typename: 'CommentMutationResult' as const,
        success: true,
        comment: {
          __typename: 'Comment' as const,
          id: `optimistic-${Date.now()}`,
          targetType: vars.input.targetType ?? targetType,
          targetId: vars.input.targetId ?? targetId,
          parentCommentId: vars.input.parentCommentId ?? null,
          authorUserId: viewer?.id ?? null,
          body: vars.input.body,
          displayName: viewer?.displayName ?? 'You',
          displayAvatarUrl: null,
          isEdited: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          replies: {
            __typename: 'CommentConnection' as const,
            edges: [],
            pageInfo: {
              __typename: 'PageInfo' as const,
              hasNextPage: false,
              endCursor: null,
            },
            totalCount: 0,
          },
        },
        errors: null,
      },
    }),

    update(cache, { data }) {
      const comment = data?.addComment.comment;
      if (!comment) return;

      const commentRef = cache.writeFragment({
        data: comment,
        fragment: CommentFieldsFragmentDoc,
        fragmentName: 'CommentFields',
      });

      if (comment.parentCommentId) {
        cache.modify({
          id: cache.identify({ __typename: 'Comment', id: comment.parentCommentId }),
          fields: {
            replies(existing: { edges: unknown[]; totalCount: number }) {
              return {
                ...existing,
                edges: [
                  ...existing.edges,
                  { __typename: 'CommentEdge', cursor: comment.id, node: commentRef },
                ],
                totalCount: (existing.totalCount ?? 0) + 1,
              };
            },
          },
        });
      } else {
        const typename = parentTypename(comment.targetType, isPublicAccess);
        // QUESTION: PublicAlbum may not have a stable cache ID since the query
        // does not pass an album ID variable. If cache.modify silently does nothing
        // for PublicAlbum, a post-mutation refetch would be required here.
        cache.modify({
          id: cache.identify({ __typename: typename, id: comment.targetId }),
          fields: {
            comments(existing: { edges: unknown[]; totalCount: number }) {
              return {
                ...existing,
                edges: [
                  { __typename: 'CommentEdge', cursor: comment.id, node: commentRef },
                  ...existing.edges,
                ],
                totalCount: (existing.totalCount ?? 0) + 1,
              };
            },
          },
        });
      }
    },
  });

  const addComment = async (input: AddCommentInput): Promise<void> => {
    await mutate({ variables: { input } });
  };

  return { addComment, loading };
};
