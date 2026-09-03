import { EmailKind, ok, OperationResult } from '@packages/contracts';
import { EmailDelivery } from '../../../domain/EmailDelivery';
import { EmailDeliveryRepository } from '../../../repositories/domainRepositories/emailDeliverRepository';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface CreateEmailDeliveryService extends WriteServiceBase {
  (
    sesMessageId: string,
    emailKind: EmailKind,
    recipientEmail: string,
    accessGrantId?: string,
  ): Promise<OperationResult<void>>;
}

type CreateEmailDeliveryServiceDeps = {
  emailDeliveryRepository: EmailDeliveryRepository;
  viewerId: EntityId;
};

export const build__CreateEmailDeliveryService =
  ({
    emailDeliveryRepository,
    viewerId,
  }: CreateEmailDeliveryServiceDeps): CreateEmailDeliveryService =>
  async (
    sesMessageId: string,
    emailKind: EmailKind,
    recipientEmail: string,
    accessGrantId?: string,
  ) => {
    const newDelivery = EmailDelivery.create(
      {
        sesMessageId,
        emailKind,
        recipientEmail,
        accessGrantId,
      },
      viewerId,
    );
    await emailDeliveryRepository.save(newDelivery);
    return ok(undefined);
  };
