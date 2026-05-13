import { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { JSX, useCallback } from 'react';
import {
  AddReactionDocument,
  type AddReactionMutation,
  RemoveReactionDocument,
  type RemoveReactionMutation,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { ReactionCountsVM } from '../../viewModels/reactions/ReactionCountsVM';
import { ReactionButton } from './ReactionButton';

type Props = {
  commentId: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions: ReactionEmoji[];
  canReact: boolean;
  onRefetch: () => Promise<void>;
};

export const ReactionsForCommentContainer = ({
  commentId,
  reactionCounts,
  viewerReactions,
  canReact,
  onRefetch,
}: Props): JSX.Element => {
  const toggleMutation = useAppMutationState();

  const handleToggle = useCallback(async (): Promise<void> => {
    if (viewerReactions.includes(ReactionEmoji.heart)) {
      const result = await toggleMutation.execute(
        {
          mutation: RemoveReactionDocument,
          variables: {
            input: {
              targetType: ReactionTargetType.comment,
              targetId: commentId,
              id: viewerReactions.find((r) => r === ReactionEmoji.heart)?.id ?? '',
            },
          },
        },
        (data: RemoveReactionMutation) => data.removeReaction,
      );
      if (result.success) {
        await onRefetch();
      }
    } else {
      const result = await toggleMutation.execute(
        {
          mutation: AddReactionDocument,
          variables: {
            input: {
              targetType: ReactionTargetType.comment,
              targetId: commentId,
              emoji: ReactionEmoji.heart,
            },
          },
        },
        (data: AddReactionMutation) => data.addReaction,
      );
      if (result.success) {
        await onRefetch();
      }
    }
  }, [commentId, onRefetch, toggleMutation, viewerReactions]);

  return (
    <ReactionButton
      // Eventually iterate over ReactionEmoji.items
      emoji={ReactionEmoji.heart}
      targetType={ReactionTargetType.comment}
      targetId={commentId}
      reactionCounts={reactionCounts}
      viewerReactions={viewerReactions}
      canReact={canReact && !toggleMutation.isLoading}
      onToggle={() => void handleToggle()}
    />
  );
};
