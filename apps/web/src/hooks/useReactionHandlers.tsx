import { EntityType, ReactionEmoji } from '@packages/contracts';
import { useNavigate } from 'react-router-dom';
import {
  AddReactionDocument,
  AddReactionMutation,
  RemoveReactionDocument,
  RemoveReactionMutation,
} from '../graphql/generated/types';
import { ViewerReactionVM } from '../viewModels/index';
import { UseAppMutationStateResult } from './useAppMutation';

const defaultBuildTileHref = (itemId: string): string => `/media/${itemId}`;

export const useReactionHandlers = (
  targetId: string,
  targetType: EntityType,
  toggleMutation: UseAppMutationStateResult,
  viewerReactions?: ViewerReactionVM[],
  onRefetch?: () => void,
  buildTileHref: (itemId: string) => string = defaultBuildTileHref,
) => {
  const navigate = useNavigate();

  if (viewerReactions == null || onRefetch == null) {
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
                emoji,
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
      void navigate(`${buildTileHref(targetId)}#comment`);
    }
  };

  return { handleToggle };
};
