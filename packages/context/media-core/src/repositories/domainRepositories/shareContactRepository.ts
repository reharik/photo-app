import { UnitOfWork } from '../../infrastructure/repositories/unitOfWork';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types/types';
import { ShareContactRow } from '../readRepositories/types';

export type ShareContactRepositoryDeps = {
  uow: UnitOfWork;
};

export interface ShareContactRepository extends RequestScopeLifeCycle {
  upsertContact: (userId: EntityId, contactUserId: EntityId, handle: string) => Promise<void>;
}

export const build__ShareContactRepository = ({
  uow,
}: ShareContactRepositoryDeps): ShareContactRepository => ({
  upsertContact: async (
    userId: EntityId,
    contactUserId: EntityId,
    handle: string,
  ): Promise<void> => {
    await uow
      .db()<ShareContactRow>('shareContact')
      .insert({
        userId,
        contactUserId,
        handle,
        lastSharedAt: new Date(),
      })
      .onConflict(['user_id', 'contact_user_id'])
      .merge(['handle', 'lastSharedAt']);
  },
});
