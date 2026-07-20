import { EntityType, InAppNotificationType, ok, WriteResult } from '@packages/contracts';
import { InAppNotificationRepository } from '../../repositories/readRepositories/inAppNotificationRepository';
import { EntityId } from '../../types';
import { WriteServiceBase } from './writeServiceBaseType';

export type ClearBySurfaceCommand = {
  viewerId: EntityId;
  targetType: EntityType;
  targetId: EntityId;
  kind: InAppNotificationType;
};

export type ClearByIdsCommand = {
  viewerId: EntityId;
  ids: EntityId[];
};

export interface MarkActivitySeen extends WriteServiceBase {
  clearBySurface: (input: ClearBySurfaceCommand) => Promise<WriteResult<{ success: boolean }>>;

  clearByIds: (input: ClearByIdsCommand) => Promise<WriteResult<{ success: boolean }>>;
}

type MarkActivitySeenDeps = {
  viewerId: EntityId;

  inAppNotificationRepository: InAppNotificationRepository;
};

export const build__MarkActivitySeen = ({
  inAppNotificationRepository,
}: MarkActivitySeenDeps): MarkActivitySeen => {
  return {
    // inAppNotificationService
    clearBySurface: async ({ viewerId, targetType, targetId, kind }: ClearBySurfaceCommand) => {
      await inAppNotificationRepository.deleteWhere({
        viewerId,
        targetType: targetType,
        targetId,
        kind,
      });
      return ok({ success: true });
    },
    clearByIds: async ({ viewerId, ids }: ClearByIdsCommand) => {
      await inAppNotificationRepository.deleteByIds({ viewerId, ids }); // viewerId scoped — never delete another viewer's rows by raw id
      return ok({ success: true });
    },
  };
};
