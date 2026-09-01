import { EntityType, InAppNotificationType, ok, OperationResult } from '@packages/contracts';
import { InAppNotificationRepository } from '../../repositories/readRepositories/inAppNotificationRepository';
import { EntityId } from '../../types';
import { WriteServiceBase } from './writeServiceBaseType';

export type ClearBySurfaceCommand = {
  containerType: EntityType;
  containerId: EntityId;
  kind: InAppNotificationType;
};

export type ClearByIdsCommand = {
  ids: EntityId[];
};

export interface MarkActivitySeen extends WriteServiceBase {
  clearBySurface: (input: ClearBySurfaceCommand) => Promise<OperationResult<{ success: boolean }>>;
  clearByIds: (input: ClearByIdsCommand) => Promise<OperationResult<{ success: boolean }>>;
}

type MarkActivitySeenDeps = {
  viewerId: EntityId;
  inAppNotificationRepository: InAppNotificationRepository;
};

export const build__MarkActivitySeen = ({
  inAppNotificationRepository,
  viewerId,
}: MarkActivitySeenDeps): MarkActivitySeen => {
  return {
    // inAppNotificationService
    clearBySurface: async ({ containerType, containerId, kind }: ClearBySurfaceCommand) => {
      await inAppNotificationRepository.deleteWhere({
        viewerId,
        containerType: containerType,
        containerId,
        kind,
      });
      return ok({ success: true });
    },
    clearByIds: async ({ ids }: ClearByIdsCommand) => {
      await inAppNotificationRepository.deleteByIds({ viewerId, ids }); // viewerId scoped — never delete another viewer's rows by raw id
      return ok({ success: true });
    },
  };
};
