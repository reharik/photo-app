import { useMutation } from '@apollo/client/react';
import {
  DeleteCommentDocument,
  type DeleteCommentInput,
  type CommentFieldsFragment,
} from '../../../graphql/generated/types';

export type UseDeleteCommentResult = {
  deleteComment: (input: DeleteCommentInput, existing: CommentFieldsFragment) => Promise<void>;
  loading: boolean;
};

export const useDeleteComment = (): UseDeleteCommentResult => {
  const [mutate, { loading }] = useMutation(DeleteCommentDocument);

  const deleteComment = async (
    input: DeleteCommentInput,
    existing: CommentFieldsFragment,
  ): Promise<void> => {
    await mutate({
      variables: { input },
      optimisticResponse: {
        deleteComment: {
          __typename: 'CommentMutationResult' as const,
          success: true,
          comment: {
            ...existing,
            __typename: 'Comment' as const,
            isDeleted: true,
            body: '',
            updatedAt: new Date(),
          },
          errors: null,
        },
      },
    });
  };

  return { deleteComment, loading };
};
