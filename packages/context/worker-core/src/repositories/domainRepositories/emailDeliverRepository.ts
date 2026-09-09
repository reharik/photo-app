import { EmailKind, EmailStatus, EntityId } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { EmailDelivery, EmailDeliveryRecord } from '../../domain/EmailDelivery';
import { UnitOfWork } from '../../infrastructure';
import { Persist } from './AggregateRepo';

export interface EmailDeliveryRepository {
  getByMessageIds: (messageIds: EntityId[]) => Promise<EmailDelivery[]>;
  save: (emailDelivery: EmailDelivery) => Promise<void>;
}

type EmailDeliveryRepositoryDeps = { persist: Persist; uow: UnitOfWork };

export const build__EmailDeliveryRepository = ({
  persist,
  uow,
}: EmailDeliveryRepositoryDeps): EmailDeliveryRepository => ({
  getByMessageIds: async (messageIds: EntityId[]): Promise<EmailDelivery[]> => {
    const emailDeliveries = await withEnumRevival(
      uow.db()<EmailDeliveryRecord>('emailDelivery').whereIn('sesMessageId', messageIds),
      { emailKind: EmailKind, status: EmailStatus },
    );
    return emailDeliveries.map((x) => EmailDelivery.rehydrate(x));
  },

  save: async (emailDelivery: EmailDelivery): Promise<void> => {
    await persist(emailDelivery);
  },
});
