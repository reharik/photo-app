import { Logger } from '@packages/infrastructure';
import { NotificationService } from '@packages/notifications';
import { EmailDeliveryRepository, UnitOfWork } from '@packages/worker-core';
import { RowOutcome } from '../outcomeCleanup';
import { ConcretePayloadResult } from './fastSweepNotificationStrategies/types';

export type FastSweepSendResult = ResultFailure | ResultSuccess;
type ResultFailure = { success: false; messageId: undefined; outcome: RowOutcome };
type ResultSuccess = { success: true; messageId: string; outcome: RowOutcome };

export interface SendNotificationForPayload {
  (result: ConcretePayloadResult): Promise<FastSweepSendResult>;
}

type SendNotificationForPayloadDeps = {
  logger: Logger;
  notificationService: NotificationService;
  uow: UnitOfWork;
  emailDeliveryRepository: EmailDeliveryRepository;
};

export const build__SendNotificationForPayload =
  ({ logger, notificationService }: SendNotificationForPayloadDeps): SendNotificationForPayload =>
  async (result: ConcretePayloadResult) => {
    let outcome: RowOutcome;

    if (result.kind === 'skipped') {
      logger.warn('[notification-send] row skipped, will be deleted without sending', {
        reason: result.reason,
        rowId: result.row.id,
        kind: result.row.kind.value,
        recipientId: result.row.recipientId,
        containerId: result.row.containerId,
        subjectId: result.row.subjectId,
      });
      outcome = { row: result.row, result: 'skipped', reason: result.reason };
      return { success: false as const, messageId: undefined, outcome };
    }
    const sent = await notificationService.notify(result.payload);

    outcome = { row: result.row, result: sent.success ? 'sent' : 'failed' };
    if (!sent.success) {
      return {
        success: false as const,
        messageId: undefined,
        outcome,
      };
    }
    return {
      success: true as const,
      messageId: sent.value,
      outcome,
    };
  };
