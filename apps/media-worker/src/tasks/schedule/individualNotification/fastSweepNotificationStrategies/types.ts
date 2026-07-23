import { AsyncNotificationKind } from '@packages/contracts';
import { AsyncNotification, UserContact } from '@packages/media-core';
import { NotificationPayload, TemplateName } from '@packages/notifications';

export type PayloadResult<T extends TemplateName> =
  | { row: AsyncNotification; kind: 'ready'; payload: NotificationPayload<T> }
  | { row: AsyncNotification; kind: 'skipped'; reason: string };

export interface FastSweepNotificationStrategy<T extends TemplateName> {
  kind: AsyncNotificationKind;
  execute: (
    rows: AsyncNotification[],
    userMap: Map<string, UserContact>,
  ) => Promise<PayloadResult<T>[]>;
}
