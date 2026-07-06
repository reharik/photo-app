import { PendingNotificationKind } from '@packages/contracts';
import { PendingNotification, UserContact } from '@packages/media-core';
import { NotificationPayload, TemplateName } from '@packages/notifications';

export type PayloadResult<T extends TemplateName> =
  | { row: PendingNotification; kind: 'ready'; payload: NotificationPayload<T> }
  | { row: PendingNotification; kind: 'skipped'; reason: string };

export interface FastSweepNotificationStrategy<T extends TemplateName> {
  kind: PendingNotificationKind;
  execute: (
    rows: PendingNotification[],
    userMap: Map<string, UserContact>,
  ) => Promise<PayloadResult<T>[]>;
}
