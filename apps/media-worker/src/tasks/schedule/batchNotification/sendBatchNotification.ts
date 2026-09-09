import { BatchedPayloadKind, EntityId } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { ActivitySection, NotificationPayload, NotificationService } from '@packages/notifications';
import { UserContact } from '@packages/worker-core';
import { Config } from '../../../config';
import { ActivityResult, LivingRow } from './batchedPayloads/types';

type SendResult =
  | { kind: 'sent'; messageId: string; email: string }
  | { kind: 'failed' }
  | { kind: 'skipped'; reason: string };

type Input = {
  recipientId: EntityId;
  rowsForRecipient: LivingRow[];
  payloads: ActivityResult[];
  recipientEmailMap: Map<string, UserContact>;
};
export interface SendBatchNotification {
  (input: Input): Promise<SendResult>;
}

type SendBatchNotificationDeps = {
  notificationService: NotificationService;
  config: Config;
  logger: Logger;
};

export const build__SendBatchNotification =
  ({ notificationService, config, logger }: SendBatchNotificationDeps): SendBatchNotification =>
  async ({
    recipientId,
    rowsForRecipient,
    payloads,
    recipientEmailMap,
  }: Input): Promise<SendResult> => {
    const recipientEmail = recipientEmailMap.get(recipientId);
    if (!recipientEmail) {
      logger.warn(
        '[notificationBatcher] no user row / email for recipient — rows will be deleted without sending',
        {
          recipientId,
          rowIds: rowsForRecipient.map((x) => x.id),
        },
      );
      return { kind: 'skipped', reason: 'no user row / email for recipient_id' };
    }
    const data = new Map<BatchedPayloadKind, ActivitySection>();
    payloads.forEach((x) => {
      const activity = x.activity.get(recipientId);
      if (activity) {
        data.set(x.kind, activity);
      }
    });
    if (data.size === 0) {
      return { kind: 'skipped', reason: 'no activity sections for recipient' };
    }

    const payload: NotificationPayload<'activityDigest'> = {
      to: recipientEmail.email,
      template: 'activityDigest',
      data: { data, appUrl: config.clientUrl },
      channels: ['email'],
    };
    const notifyResult = await notificationService.notify(payload);
    if (!notifyResult.success) {
      return { kind: 'failed' };
    }
    return { kind: 'sent', messageId: notifyResult.value, email: recipientEmail.email };
  };
