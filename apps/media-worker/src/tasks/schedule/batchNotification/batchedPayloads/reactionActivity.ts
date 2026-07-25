import {
  AsyncNotificationKind,
  BatchedPayloadKind,
  EntityType,
  filterByMember,
  notEmpty,
  toDisplayName,
} from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  AsyncNotification,
  SystemCommentRepository,
  SystemUserRepository,
} from '@packages/media-core';
import { ReactionItem, ReactionSection } from '@packages/notifications';
import { EnumSubset, pickEnum } from '@reharik/smart-enum';
import { RowOutcome } from '../../outcomeCleanup';
import { ActivityResult, BatchedEmailPayload } from './types';

export interface ReactionActivity extends BatchedEmailPayload {
  execute: (rows: AsyncNotification[]) => Promise<ActivityResult>;
}

type ReactionActivityDeps = {
  systemUserRepository: SystemUserRepository;
  systemCommentRepository: SystemCommentRepository;
  logger: Logger;
};

export const build__ReactionActivity = ({
  systemUserRepository,
  systemCommentRepository,
  logger,
}: ReactionActivityDeps): ReactionActivity => ({
  execute: async (rows): Promise<ActivityResult> => {
    const reactionRowKind = pickEnum(AsyncNotificationKind, ['reactionAdded']);
    const reactionRows = filterByMember(rows, 'kind', reactionRowKind);
    const users = await systemUserRepository.getActiveUsers(reactionRows.map((x) => x.actorId));
    const userMap = indexBy(users);

    const commentRowKind = pickEnum(EntityType, ['comment']);
    const commentReactionRows = filterByMember(rows, 'containerType', commentRowKind).map(
      (x) => x.containerId,
    );
    const comments = await systemCommentRepository.getCommentsByIds(commentReactionRows);
    const mediaIdMap = indexBy(
      comments,
      (x) => x.id,
      (x) => x.targetId,
    );

    // resolve each row ONCE → row + its fate + (if resolved) the rendered line
    const resolved = reactionRows.map((row) => {
      const user = userMap.get(row.actorId);
      if (!user) {
        return {
          row,
          result: 'skipped' as const,
          recipientId: row.recipientId,
          reason: 'actor not found / inactive',
        };
      }
      const reactorName = toDisplayName(user);
      const line: ReactionItem = {
        reactorName,
        reactionTargetType: row.containerType as EnumSubset<EntityType, 'comment' | 'mediaItem'>,
      };
      return {
        row,
        result: 'resolved' as const,
        recipientId: row.recipientId,
        targetItemId: row.containerId,
        line,
      };
    });

    const outcomes: RowOutcome[] = resolved
      .filter((r) => r.result === 'skipped')
      .map(({ row }) => ({ row, result: 'skipped' }));

    // group only the survivors, and only for building the section
    const survivors = resolved.filter((r) => r.result === 'resolved');
    const byRecipient = groupByMapping(survivors, (r) => r.recipientId);

    const reactionSection = new Map<string, ReactionSection>();
    for (const [recipientId, rs] of byRecipient) {
      const byItem = groupByMapping(rs, (r) => r.targetItemId);
      const items = [...byItem]
        .map(([containerId, itemRs]) => {
          // A reaction's link target is the underlying media item. When the reaction
          // is on the media item itself, that IS the containerId; when it's on a
          // comment, resolve the comment's targetId (mediaIdMap is keyed by comment id).
          const containerType = itemRs[0]?.row.containerType;
          const mediaId =
            containerType && containerType.equals(EntityType.mediaItem)
              ? containerId
              : mediaIdMap.get(containerId);
          if (!mediaId) {
            logger.warn('reaction row missing mediaId, skipping');
            return;
          }
          return {
            containerId,
            mediaId,
            reactions: itemRs.map((r) => r.line),
          };
        })
        .filter(notEmpty);
      reactionSection.set(recipientId, items);
    }

    return { kind: BatchedPayloadKind.reaction, activity: reactionSection, outcomes };
  },
});
