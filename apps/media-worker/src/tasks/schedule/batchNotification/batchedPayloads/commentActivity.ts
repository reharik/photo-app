import {
  AsyncNotificationKind,
  BatchedPayloadKind,
  filterByMember,
  notEmpty,
} from '@packages/contracts';
import { groupByMapping, indexBy } from '@packages/infrastructure';
import {
  AsyncNotification,
  SystemCommentRepository,
  SystemUserRepository,
} from '@packages/media-core';
import { CommentSection } from '@packages/notifications';
import { pickEnum } from '@reharik/smart-enum';
import { RowOutcome } from '../../outcomeCleanup';
import { ActivityResult, BatchedEmailPayload } from './types';

export interface CommentActivity extends BatchedEmailPayload {
  execute: (rows: AsyncNotification[]) => Promise<ActivityResult>;
}

type CommentActivityDeps = {
  systemUserRepository: SystemUserRepository;
  systemCommentRepository: SystemCommentRepository;
};

const truncate = (s: string, max = 140) => {
  if ([...s].length <= max) return s; // [...s] counts by code POINT, not unit
  const clipped = [...s].slice(0, max).join(''); // never splits a surrogate pair
  const lastSpace = clipped.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped) + '…';
};

export const build__CommentActivity = ({
  systemUserRepository,
  systemCommentRepository,
}: CommentActivityDeps): CommentActivity => ({
  execute: async (rows): Promise<ActivityResult> => {
    const commentRowKind = pickEnum(AsyncNotificationKind, ['commentPosted', 'replyPosted']);
    const commentRows = filterByMember(rows, 'kind', commentRowKind);

    const comments = await systemCommentRepository.getCommentsByIds(
      commentRows.map((x) => x.data!.commentId).filter(notEmpty),
    );
    const users = await systemUserRepository.getUserContacts(comments.map((x) => x.authorId));
    const userMap = indexBy(users);

    const commentMap = indexBy(comments);

    // resolve each row ONCE → row + its fate + (if resolved) the rendered line
    const resolved = commentRows.map((row) => {
      const comment = commentMap.get(row.data!.commentId!);
      if (!comment) return { row, result: 'skipped' as const }; // hard-deleted → accounted, not eaten
      const user = userMap.get(comment.authorId);
      const commenterName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
      return {
        row,
        result: 'resolved' as const,
        recipientId: row.recipientId,
        mediaItemId: row.containerId,
        line: { snippet: truncate(comment.body), commenterName },
      };
    });

    const outcomes: RowOutcome[] = resolved
      .filter((r) => r.result === 'skipped')
      .map(({ row }) => ({ row, result: 'skipped' }));

    // group only the survivors, and only for building the section
    const survivors = resolved.filter((r) => r.result === 'resolved');
    const byRecipient = groupByMapping(survivors, (r) => r.recipientId);

    const commentSection = new Map<string, CommentSection>();
    for (const [recipientId, rs] of byRecipient) {
      const byItem = groupByMapping(rs, (r) => r.mediaItemId);
      const items = [...byItem].map(([mediaItemId, itemRs]) => ({
        mediaItemId,
        comments: itemRs.map((r) => r.line),
      }));
      commentSection.set(recipientId, items);
    }

    return { kind: BatchedPayloadKind.comment, activity: commentSection, outcomes };
  },
});
