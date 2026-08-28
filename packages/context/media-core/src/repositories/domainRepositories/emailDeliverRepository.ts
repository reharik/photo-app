import { EmailDelivery } from '../../domain/EmailDelivery';
import { RequestScopeLifeCycle } from '../../services';
import { Persist } from './AggregateRepo';

export interface EmailDeliveryRepository extends RequestScopeLifeCycle {
  save: (emailDelivery: EmailDelivery) => Promise<void>;
}

type EmailDeliveryRepositoryDeps = { persist: Persist };

export const build__EmailDeliveryRepository = ({
  persist,
}: EmailDeliveryRepositoryDeps): EmailDeliveryRepository => ({
  save: async (emailDelivery: EmailDelivery): Promise<void> => {
    await persist(emailDelivery);
  },
});
