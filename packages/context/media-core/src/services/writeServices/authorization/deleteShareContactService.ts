import { ok, OperationResult } from '@packages/contracts';
import { ShareContactRepository } from '../../../repositories';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface DeleteShareContactService extends WriteServiceBase {
  (handle: string, viewerId: EntityId): Promise<OperationResult<{ handle: string }>>;
}

type DeleteShareContactServiceDeps = {
  shareContactRepository: ShareContactRepository;
};

export const build__DeleteShareContactService =
  ({ shareContactRepository }: DeleteShareContactServiceDeps): DeleteShareContactService =>
  async (handle: string, viewerId: EntityId) => {
    void (await shareContactRepository.deleteContact(handle, viewerId));
    return ok({ handle });
  };
