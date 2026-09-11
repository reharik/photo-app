import { EntityId } from '@packages/contracts';
import { InAppNotification } from '../../../repositories';
import { InAppNotificationRepository } from '../../../repositories/readRepositories/inAppNotificationRepository';
import { ReadServiceBase } from '../readServiceBaseType';

export interface ViewerHasInAppNotificationService extends ReadServiceBase {
  getInAppNotification: () => Promise<InAppNotification[]>;
}

type ViewerHasInAppNotificationServiceDeps = {
  viewerId: EntityId;
  inAppNotificationRepository: InAppNotificationRepository;
};

export const build__ViewerHasInAppNotificationService = ({
  viewerId,
  inAppNotificationRepository,
}: ViewerHasInAppNotificationServiceDeps): ViewerHasInAppNotificationService => ({
  getInAppNotification: async (): Promise<InAppNotification[]> => {
    return inAppNotificationRepository.getInAppNotification(viewerId);
  },
});
