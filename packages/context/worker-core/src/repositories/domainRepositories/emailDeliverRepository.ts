import { EmailKind, EmailStatus } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { EmailDelivery, EmailDeliveryRecord } from '../../domain/EmailDelivery';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services';
import { EntityId } from '../../types';
import { Persist } from './AggregateRepo';

export interface EmailDeliveryRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<EmailDelivery | undefined>;
  getByMessageIds: (messageIds: EntityId[]) => Promise<EmailDelivery[]>;
  save: (emailDelivery: EmailDelivery) => Promise<void>;
}

type EmailDeliveryRepositoryDeps = { persist: Persist; uow: UnitOfWork };

export const build__EmailDeliveryRepository = ({
  persist,
  uow,
}: EmailDeliveryRepositoryDeps): EmailDeliveryRepository => ({
  getById: async (id: EntityId): Promise<EmailDelivery | undefined> => {
    await uow.join();
    const emailDelivery = await withEnumRevival(
      uow.db()<EmailDeliveryRecord>('emailDelivery').where({ id }).first(),
      { emailKind: EmailKind, status: EmailStatus },
    );
    if (!emailDelivery) {
      return undefined;
    }
    return EmailDelivery.rehydrate(emailDelivery);
  },

  getByMessageIds: async (messageIds: EntityId[]): Promise<EmailDelivery[]> => {
    await uow.join();
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
