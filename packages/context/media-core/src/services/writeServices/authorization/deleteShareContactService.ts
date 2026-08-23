import { ok, OperationResult } from '@packages/contracts';
import { ShareContactRepository } from '../../../repositories';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface DeleteShareContactService extends WriteServiceBase {
  (handle: string): Promise<OperationResult<{ handle: string }>>;
}

type DeleteShareContactServiceDeps = {
  viewerId: EntityId;
  shareContactRepository: ShareContactRepository;
};

export const build__DeleteShareContactService =
  ({
    viewerId,
    shareContactRepository,
  }: DeleteShareContactServiceDeps): DeleteShareContactService =>
  async (handle: string) => {
    void (await shareContactRepository.deleteContact(handle, viewerId));
    return ok({ handle });
  };
