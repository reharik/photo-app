import { ok, UnseenActivityType, WriteResult } from '@packages/contracts';
import { UnseenActivityTargetType } from '../../repositories';
import { UnseenActivityRepository } from '../../repositories/readRepositories/unseenActivityRepository';
import { EntityId } from '../../types';
import { WriteServiceBase } from './writeServiceBaseType';

export type ClearBySurfaceCommand = {
  viewerId: EntityId;
  targetType: typeof UnseenActivityTargetType;
  targetId: EntityId;
  kind: UnseenActivityType;
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

  unseenActivityRepository: UnseenActivityRepository;
};

export const build__MarkActivitySeen = ({
  unseenActivityRepository,
}: MarkActivitySeenDeps): MarkActivitySeen => {
  return {
    // unseenActivityService
    clearBySurface: async ({ viewerId, targetType, targetId, kind }: ClearBySurfaceCommand) => {
      await unseenActivityRepository.deleteWhere({
        viewerId,
        targetType: targetType,
        targetId,
        activityKind: kind,
      });
      return ok({ success: true });
    },
    clearByIds: async ({ viewerId, ids }: ClearByIdsCommand) => {
      await unseenActivityRepository.deleteByIds({ viewerId, ids }); // viewerId scoped — never delete another viewer's rows by raw id
      return ok({ success: true });
    },
  };
};
