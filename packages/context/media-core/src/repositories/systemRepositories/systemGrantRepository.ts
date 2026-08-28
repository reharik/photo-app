import { UnitOfWork } from '../../infrastructure';
import { EntityId } from '../../types';

export type SystemGrantRepository = {
  pruneGrantsForAuthorization: (
    authId: EntityId,
    keepIds: EntityId[],
    uow?: UnitOfWork,
  ) => Promise<void>;
  upsertGrants: (input: UpsertGrantInput[]) => Promise<void>;
};

export type SystemGrantRepositoryDeps = {
  uow: UnitOfWork;
};

export type UpsertGrantInput = {
  id: EntityId;
  accessGrantId: EntityId;
  mediaItemId: EntityId;
  grantedToUser?: EntityId;
  operations: string[];
};

export const build__SystemGrantRepository = ({
  uow,
}: SystemGrantRepositoryDeps): SystemGrantRepository => ({
  pruneGrantsForAuthorization: async (authId: EntityId, keepIds: EntityId[]) => {
    await uow.join();
    const del = uow.db()('grant').where({ accessGrantId: authId });
    if (keepIds.length) del.whereNotIn('mediaItemId', keepIds);
    return del.delete();
  },
  upsertGrants: async (input: UpsertGrantInput[]) => {
    if (input.length === 0) return;
    await uow.join();
    await uow
      .db()('grant')
      .insert(input)
      .onConflict(['accessGrantId', 'mediaItemId'])
      .merge(['operations']);
  },
});
