import { AsyncNotificationKind, EmailKind, EntityId } from '@packages/contracts';
import { NotificationPayload, TemplateName } from '@packages/notifications';
import { AsyncNotification, UserContact } from '@packages/worker-core';

export type PayloadResult<T extends TemplateName> =
  | {
      row: AsyncNotification;
      kind: 'ready';
      payload: NotificationPayload<T>;
      recipientEmail: string;
      emailKind: EmailKind;
      // Carried alongside emailKind/recipientEmail purely so fastSweepNotification can
      // stamp it on the EmailDelivery row. Optional: a strategy for a kind with no
      // grant would leave it undefined, same as the column.
      accessGrantId?: EntityId;
    }
  | { row: AsyncNotification; kind: 'skipped'; reason: string };

export interface FastSweepNotificationStrategy<T extends TemplateName> {
  kind: AsyncNotificationKind;
  execute: (
    rows: AsyncNotification[],
    userMap: Map<string, UserContact>,
  ) => Promise<PayloadResult<T>[]>;
}
