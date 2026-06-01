import { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { useNavigate } from 'react-router-dom';
import { RemoveReactionMutation } from 'src/graphql/generated/types';
import {
  AddReactionDocument,
  AddReactionMutation,
  RemoveReactionDocument,
} from '../graphql/generated/types';
import { ViewerReactionVM } from '../viewModels/index';
import { UseAppMutationStateResult } from './useAppMutation';

export const useReactionHandlers = (
  targetId: string,
  targetType: ReactionTargetType,
  toggleMutation: UseAppMutationStateResult,
  viewerReactions?: ViewerReactionVM[],
  onRefetch?: () => void,
) => {
  const navigate = useNavigate();

  if (!viewerReactions || !onRefetch) {
    return { handleToggle: () => Promise.resolve() };
  }

  const handleToggle = async (emoji: ReactionEmoji): Promise<void> => {
    if (emoji.equals(ReactionEmoji.heart)) {
      const reaction = viewerReactions.find((r) => r.emoji.equals(emoji));
      if (reaction) {
        const result = await toggleMutation.execute(
          {
            mutation: RemoveReactionDocument,
            variables: {
              input: {
                targetType,
                targetId,
                id: reaction.id,
              },
            },
          },
          (data: RemoveReactionMutation) => data.removeReaction,
        );
        if (result.success) {
          onRefetch();
        }
      } else {
        const result = await toggleMutation.execute(
          {
            mutation: AddReactionDocument,
            variables: {
              input: {
                targetType,
                targetId,
                emoji,
              },
            },
          },
          (data: AddReactionMutation) => data.addReaction,
        );
        if (result.success) {
          onRefetch();
        }
      }
    }
    if (emoji.equals(ReactionEmoji.comment)) {
      void navigate(`/media/${targetId}#comment`);
    }
  };

  return { handleToggle };
};
