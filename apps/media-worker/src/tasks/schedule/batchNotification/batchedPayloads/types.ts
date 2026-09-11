import { BatchedPayloadKind, NotificationKind } from '@packages/contracts';
import { ActivitySection } from '@packages/notifications';
import { AsyncNotification } from '@packages/worker-core';
import { RowOutcome } from '../../outcomeCleanup';

export interface BatchedEmailPayload {
  execute: (rows: AsyncNotification[]) => Promise<ActivityResult>;
}

export type LivingRow = AsyncNotification & {
  kind: NotificationKind;
};

export type ActivityResult = {
  kind: BatchedPayloadKind;
  activity: Map<string, ActivitySection>;
  deadRows: RowOutcome[];
  livingRows: LivingRow[];
};
