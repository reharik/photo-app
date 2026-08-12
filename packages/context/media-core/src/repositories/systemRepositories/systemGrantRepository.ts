import { Knex } from 'knex';
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
  database: Knex;
};

export type UpsertGrantInput = {
  id: EntityId;
  accessGrantId: EntityId;
  mediaItemId: EntityId;
  grantedToUser?: EntityId;
  operations: string[];
};

export const build__SystemGrantRepository = ({
  database,
}: SystemGrantRepositoryDeps): SystemGrantRepository => ({
  pruneGrantsForAuthorization: (authId: EntityId, keepIds: EntityId[], uow?: UnitOfWork) => {
    const db = uow?.db() ?? database;
    const del = db('grant').where({ accessGrantId: authId });
    if (keepIds.length) del.whereNotIn('mediaItemId', keepIds);
    return del.delete();
  },
  upsertGrants: async (input: UpsertGrantInput[]) => {
    if (input.length === 0) return;
    await database('grant')
      .insert(input)
      .onConflict(['accessGrantId', 'mediaItemId'])
      .merge(['operations']);
  },
});
