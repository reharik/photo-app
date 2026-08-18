import { EmailKind, ok, OperationResult } from '@packages/contracts';
import { EmailDelivery } from '../../../domain/EmailDelivery';
import { EmailDeliveryRepository } from '../../../repositories/domainRepositories/emailDeliverRepository';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface CreateEmailDeliveryService extends WriteServiceBase {
  (
    sesMessageId: string,
    emailKind: EmailKind,
    recipientEmail: string,
    actorId: string,
    authorizationId?: string,
  ): Promise<OperationResult<void>>;
}

type CreateEmailDeliveryServiceDeps = {
  emailDeliveryRepository: EmailDeliveryRepository;
};

export const build__CreateEmailDeliveryService =
  ({ emailDeliveryRepository }: CreateEmailDeliveryServiceDeps): CreateEmailDeliveryService =>
  async (
    sesMessageId: string,
    emailKind: EmailKind,
    recipientEmail: string,
    actorId: string,
    authorizationId?: string,
  ) => {
    const newDelivery = EmailDelivery.create(
      {
        sesMessageId,
        emailKind,
        recipientEmail,
        authorizationId,
      },
      actorId,
    );
    await emailDeliveryRepository.save(newDelivery);
    return ok(undefined);
  };
