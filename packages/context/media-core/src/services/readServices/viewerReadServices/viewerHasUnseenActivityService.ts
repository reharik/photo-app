import {
  UnseenActivityRepository,
  UnseenActivitySummary,
} from '../../../repositories/readRepositories/unseenActivityRepository';
import { EntityId } from '../../../types';
import { ReadServiceBase } from '../readServiceBaseType';

export interface ViewerHasUnseenActivityService extends ReadServiceBase {
  getUnseenActivity: () => Promise<boolean>;
  getUnseenActivitySummary: () => Promise<UnseenActivitySummary>;
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
  getUnseenActivitySummary: async (): Promise<UnseenActivitySummary> => {
    return unseenActivityRepository.getUnseenActivitySummary(viewerId);
  },
});
