import { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { useReactionHandlers } from '../../hooks/useReactionHandlers';
import { ReactionCountsVM, ViewerReactionVM } from '../../viewModels/';
import { ReactionButton } from './ReactionButton';

type Props = {
  targetType: ReactionTargetType;
  targetId: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
  canReact?: boolean;
  onRefetch?: () => void;
};

export const ReactionsContainer = ({
  targetType,
  targetId,
  reactionCounts,
  viewerReactions,
  canReact,
  onRefetch,
}: Props) => {
  const toggleMutation = useAppMutationState();
  const { handleToggle } = useReactionHandlers(
    targetId,
    targetType,
    toggleMutation,
    viewerReactions,
    onRefetch,
  );

  if (reactionCounts.total === 0 && !canReact) {
    return <div style={{ height: '34px' }}>&nbsp;</div>;
  }

  const displayEmojis = (
    canReact
      ? ReactionEmoji.items()
      : ReactionEmoji.items().filter((emoji) =>
          reactionCounts.byEmoji.some((r) => r.emoji.equals(emoji) && r.count > 0),
        )
  ).filter(
    (emoji) =>
      !(emoji.equals(ReactionEmoji.comment) && targetType.equals(ReactionTargetType.comment)),
  );

  return (
    <>
      {displayEmojis.map((emoji) => (
        <ReactionButton
          key={emoji.value}
          emoji={emoji}
          targetType={targetType}
          targetId={targetId}
          reactionCounts={reactionCounts}
          viewerReactions={viewerReactions}
          canReact={canReact && !toggleMutation.isLoading}
          onToggle={() => void handleToggle(emoji)}
        />
      ))}
    </>
  );
};
