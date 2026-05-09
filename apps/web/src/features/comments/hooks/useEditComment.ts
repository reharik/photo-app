import { useMutation } from '@apollo/client/react';
import {
  EditCommentDocument,
  type EditCommentInput,
  type CommentFieldsFragment,
} from '../../../graphql/generated/types';

export type UseEditCommentResult = {
  editComment: (input: EditCommentInput, existing: CommentFieldsFragment) => Promise<void>;
  loading: boolean;
};

export const useEditComment = (): UseEditCommentResult => {
  const [mutate, { loading }] = useMutation(EditCommentDocument);

  const editComment = async (
    input: EditCommentInput,
    existing: CommentFieldsFragment,
  ): Promise<void> => {
    await mutate({
      variables: { input },
      optimisticResponse: {
        editComment: {
          __typename: 'CommentMutationResult' as const,
          success: true,
          comment: {
            ...existing,
            __typename: 'Comment' as const,
            body: input.body,
            isEdited: true,
            updatedAt: new Date(),
          },
          errors: null,
        },
      },
    });
  };

  return { editComment, loading };
};
