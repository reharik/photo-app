import { BatchedPayloadKind } from '@packages/contracts';
import { AsyncNotification } from '@packages/media-core';
import { ActivitySection } from '@packages/notifications';
import { RowOutcome } from '../../outcomeCleanup';

export interface BatchedEmailPayload {
  execute: (rows: AsyncNotification[]) => Promise<ActivityResult>;
}

export type ActivityResult = {
  kind: BatchedPayloadKind;
  activity: Map<string, ActivitySection>;
  outcomes: RowOutcome[];
};
