import { UnitOfWork } from '../../infrastructure/repositories/unitOfWork';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types/types';
import { ShareContactRow } from '../readRepositories/types';

export type ShareContactRepositoryDeps = {
  uow: UnitOfWork;
};

export interface ShareContactRepository extends RequestScopeLifeCycle {
  upsertContact: (handle: string, userId: EntityId, contactUserId?: EntityId) => Promise<void>;
  deleteContact: (handle: string, viewerId: EntityId) => Promise<void>;
}

export const build__ShareContactRepository = ({
  uow,
}: ShareContactRepositoryDeps): ShareContactRepository => ({
  upsertContact: async (
    handle: string,
    userId: EntityId,
    contactUserId?: EntityId,
  ): Promise<void> => {
    await uow
      .db()<ShareContactRow>('shareContact')
      .insert({
        userId,
        contactUserId,
        handle,
        lastSharedAt: new Date(),
      })
      .onConflict(['user_id', 'handle'])
      .merge(['handle', 'lastSharedAt']);
  },
  deleteContact: async (handle: string, viewerId: EntityId) => {
    await uow.db()('shareContact').delete().where({ userId: viewerId, handle: handle });
  },
});
