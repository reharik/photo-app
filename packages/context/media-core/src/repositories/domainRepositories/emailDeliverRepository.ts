import { EmailDelivery } from '../../domain/EmailDelivery';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services';
import { persist } from './AggregateRepo';

export interface EmailDeliveryRepository extends RequestScopeLifeCycle {
  save: (emailDelivery: EmailDelivery) => Promise<void>;
}

type EmailDeliveryRepositoryDeps = { uow: UnitOfWork };

export const build__EmailDeliveryRepository = ({
  uow,
}: EmailDeliveryRepositoryDeps): EmailDeliveryRepository => ({
  save: async (emailDelivery: EmailDelivery): Promise<void> => {
    await persist(emailDelivery, uow);
  },
});
