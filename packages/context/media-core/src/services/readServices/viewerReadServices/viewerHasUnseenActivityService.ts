import { UnseenActivityRepository } from '../../../repositories/readRepositories/unseenActivityRepository';
import { EntityId } from '../../../types';
import { ReadServiceBase } from '../readServiceBaseType';

export interface ViewerHasUnseenActivityService extends ReadServiceBase {
  getUnseenActivity: () => Promise<boolean>;
}

type ViewerHasUnseenActivityServiceDeps = {
  viewerId: EntityId;
  unseenActivityRepository: UnseenActivityRepository;
};

export const build__ViewerHasUnseenActivityService = ({
  viewerId,
  unseenActivityRepository,
}: ViewerHasUnseenActivityServiceDeps): ViewerHasUnseenActivityService => ({
  getUnseenActivity: async (): Promise<boolean> => {
    return unseenActivityRepository.getUnseenActivity(viewerId);
  },
});
