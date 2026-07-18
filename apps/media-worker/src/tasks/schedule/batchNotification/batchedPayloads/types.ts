import { ActivityKind } from '@packages/contracts';
import { PendingNotification } from '@packages/media-core';
import { ActivitySection } from '@packages/notifications';
import { RowOutcome } from '../../outcomeCleanup';

export interface BatchedEmailPayload {
  execute: (rows: PendingNotification[]) => Promise<ActivityResult>;
}

export type ActivityResult = {
  kind: ActivityKind;
  activity: Map<string, ActivitySection>;
  outcomes: RowOutcome[];
};
