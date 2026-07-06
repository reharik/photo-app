import { EntityType, ok, WriteResult } from '@packages/contracts';
import { UnseenActivityRepository } from '../../repositories/readRepositories/unseenActivityRepository';
import { EntityId } from '../../types';
import { WriteServiceBase } from './writeServiceBaseType';

export type MarkActivitySeenInput = {
  targetType: EntityType;
  targetId: EntityId;
  viewerId: EntityId;
};

export interface MarkActivitySeen extends WriteServiceBase {
  (input: MarkActivitySeenInput): Promise<WriteResult<{ success: boolean }>>;
}

type MarkActivitySeenDeps = {
  viewerId: EntityId;

  unseenActivityRepository: UnseenActivityRepository;
};

export const build__MarkActivitySeen = ({
  unseenActivityRepository,
}: MarkActivitySeenDeps): MarkActivitySeen => {
  return async (input: MarkActivitySeenInput): Promise<WriteResult<{ success: boolean }>> => {
    const { targetType, targetId, viewerId } = input;
    await unseenActivityRepository.markSeen(targetType, targetId, viewerId);

    return ok({ success: true });
  };
};
