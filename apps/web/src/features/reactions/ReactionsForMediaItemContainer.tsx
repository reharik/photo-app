import { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { useCallback } from 'react';
import {
  AddReactionDocument,
  type AddReactionMutation,
  RemoveReactionDocument,
  type RemoveReactionMutation,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { ReactionCountsVM, ViewerReactionVM } from '../../viewModels/';
import { ReactionButton } from './ReactionButton';

type Props = {
  mediaItemId?: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
  canReact?: boolean;
  onRefetch?: () => void;
};

export const ReactionsForMediaItemContainer = ({
  mediaItemId,
  reactionCounts,
  viewerReactions,
  canReact,
  onRefetch,
}: Props) => {
  const toggleMutation = useAppMutationState();

  const handleToggle = useCallback(async (): Promise<void> => {
    if (!mediaItemId || !onRefetch) {
      return;
    }
    const heartReaction = viewerReactions?.find((r) => r.emoji === ReactionEmoji.heart);
    if (heartReaction) {
      const result = await toggleMutation.execute(
        {
          mutation: RemoveReactionDocument,
          variables: {
            input: {
              targetType: ReactionTargetType.mediaItem,
              targetId: mediaItemId,
              id: heartReaction.id,
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
              targetType: ReactionTargetType.mediaItem,
              targetId: mediaItemId,
              emoji: ReactionEmoji.heart,
            },
          },
        },
        (data: AddReactionMutation) => data.addReaction,
      );
      if (result.success) {
        onRefetch();
      }
    }
  }, [mediaItemId, onRefetch, toggleMutation, viewerReactions]);
  const hasHeartReaction = reactionCounts.byEmoji?.find((r) => r.emoji === ReactionEmoji.heart);
  if (!canReact && !hasHeartReaction) {
    return <div style={{ height: '34px' }}>&nbsp;</div>;
  }

  return (
    <ReactionButton
      // Eventually iterate over ReactionEmoji.items
      emoji={ReactionEmoji.heart}
      targetType={ReactionTargetType.mediaItem}
      targetId={mediaItemId}
      reactionCounts={reactionCounts}
      viewerReactions={viewerReactions}
      canReact={canReact && !toggleMutation.isLoading}
      onToggle={() => void handleToggle()}
    />
  );
};
