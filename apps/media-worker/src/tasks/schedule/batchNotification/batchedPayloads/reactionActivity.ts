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
}: ReactionActivityDeps): ReactionActivity => ({
  execute: async (rows): Promise<ActivityResult> => {
    const reactionRowKind = pickEnum(AsyncNotificationKind, ['reactionAdded']);
    const reactionRows = filterByMember(rows, 'kind', reactionRowKind);
    const users = await systemUserRepository.getActiveUsers(
      reactionRows.map((x) => x.actorId).filter(notEmpty),
    );
    const userMap = indexBy(users);

    const commentContainerKind = pickEnum(EntityType, ['comment']);
    const commentIds = filterByMember(reactionRows, 'containerType', commentContainerKind).map(
      (x) => x.containerId,
    );
    const comments = await systemCommentRepository.getCommentsByIds(commentIds);
    const mediaIdMap = indexBy(
      comments,
      (x) => x.id,
      (x) => x.targetId,
    );

    // resolve each row ONCE → row + its fate + (if resolved) the rendered line.
    // Link-target resolution happens HERE, not at render time, so a deleted
    // comment is a fate with a reason instead of a mid-render disappearance.
    const resolved = reactionRows.map((row) => {
      const user = row.actorId ? userMap.get(row.actorId) : undefined;
      if (!user) {
        return { row, result: 'skipped' as const, reason: 'actor not found / inactive' };
      }
      // A reaction's link target is the underlying media item. When the reaction
      // is on the media item itself, that IS the containerId; when it's on a
      // comment, resolve the comment's targetId (mediaIdMap is keyed by comment id).
      const mediaId = EntityType.mediaItem.equals(row.containerType)
        ? row.containerId
        : mediaIdMap.get(row.containerId);
      if (!mediaId) {
        return {
          row,
          result: 'skipped' as const,
          reason: 'reaction target comment missing — deleted since enqueue?',
        };
      }
      const line: ReactionItem = {
        reactorName: toDisplayName(user),
        reactionTargetType: row.containerType as EnumSubset<EntityType, 'comment' | 'mediaItem'>,
      };
      return {
        row,
        result: 'resolved' as const,
        recipientId: row.recipientId,
        targetItemId: row.containerId,
        mediaId,
        line,
      };
    });

    const deadRows: RowOutcome[] = resolved
      .filter((r) => r.result === 'skipped')
      .map(({ row, reason }) => ({ row, result: 'skipped' as const, reason }));

    const survivors = resolved.filter(
      (r): r is Extract<(typeof resolved)[number], { result: 'resolved' }> =>
        r.result === 'resolved',
    );
    const byRecipient = groupByMapping(survivors, (r) => r.recipientId);

    const reactionSection = new Map<string, ReactionSection>();
    for (const [recipientId, rs] of byRecipient) {
      const byItem = groupByMapping(rs, (r) => r.targetItemId);
      const items = [...byItem].map(([containerId, itemRs]) => ({
        containerId,
        mediaId: itemRs[0].mediaId, // uniform per group: targetItemId ⇒ same target ⇒ same mediaId
        reactions: itemRs.map((r) => r.line),
      }));
      reactionSection.set(recipientId, items);
    }

    return {
      kind: BatchedPayloadKind.reaction,
      activity: reactionSection,
      deadRows,
      livingRows: survivors.map((r) => r.row),
    };
  },
});
