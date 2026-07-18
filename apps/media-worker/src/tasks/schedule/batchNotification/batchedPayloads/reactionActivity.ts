import {
  ActivityKind,
  AsyncNotificationKind,
  EntityType,
  filterByMember,
} from '@packages/contracts';
import { groupByMapping, indexBy } from '@packages/infrastructure';
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
};

export const build__ReactionActivity = ({
  systemUserRepository,
}: ReactionActivityDeps): ReactionActivity => ({
  execute: async (rows): Promise<ActivityResult> => {
    const reactionRowKind = pickEnum(AsyncNotificationKind, ['reactionAdded']);
    const reactionRows = filterByMember(rows, 'kind', reactionRowKind);
    const users = await systemUserRepository.getActiveUsers(reactionRows.map((x) => x.actorId));
    const userMap = indexBy(users);

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
      const reactorName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
      const line: ReactionItem = {
        reactorName,
        reactionTargetType: row.aggregateType as EnumSubset<EntityType, 'comment' | 'mediaItem'>,
      };
      return {
        row,
        result: 'resolved' as const,
        recipientId: row.recipientId,
        targetItemId: row.aggregateId,
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
      const items = [...byItem].map(([targetId, itemRs]) => ({
        targetId,
        reactions: itemRs.map((r) => r.line),
      }));
      reactionSection.set(recipientId, items);
    }

    return { kind: ActivityKind.reaction, activity: reactionSection, outcomes };
  },
});
