import { SYSTEM_ACTOR_ID } from '@packages/contracts';
import { EmailDelivery, EmailDeliveryRepository } from '@packages/worker-core';
import { ConcretePayloadResult } from './fastSweepNotificationStrategies/types';

export interface PersistNotificationDelivery {
  (result: ConcretePayloadResult, messageId: string): Promise<void>;
}

type PersistNotificationDeliveryDeps = { emailDeliveryRepository: EmailDeliveryRepository };

export const build__PersistNotificationDelivery =
  ({ emailDeliveryRepository }: PersistNotificationDeliveryDeps): PersistNotificationDelivery =>
  async (result: ConcretePayloadResult, messageId: string) => {
    if (result.kind !== 'ready') {
      throw new Error('Sent result not in ready state');
    }
    const newEmailDelivery = EmailDelivery.create(
      {
        sesMessageId: messageId,
        emailKind: result.emailKind,
        recipientEmail: result.recipientEmail,
        accessGrantId: result.accessGrantId,
      },
      SYSTEM_ACTOR_ID,
    );
    await emailDeliveryRepository.save(newEmailDelivery);
  };
