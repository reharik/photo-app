import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemGrantRepository = {
  pruneGrantsForAuthorization: (authId: EntityId, keepIds: EntityId[]) => Promise<void>;
  upsertGrants: (input: UpsertGrantInput[]) => Promise<void>;
};

export type SystemGrantRepositoryDeps = {
  database: Knex;
};

export type UpsertGrantInput = {
  accessGrantId: EntityId;
  mediaItemId: EntityId;
  grantedToUser: EntityId;
  operations: string[];
  createdBy: EntityId;
  updatedBy: EntityId;
};

export const build__SystemGrantRepository = ({
  database,
}: SystemGrantRepositoryDeps): SystemGrantRepository => ({
  pruneGrantsForAuthorization: (authId: EntityId, keepIds: EntityId[]) => {
    const del = database('grant').where({ accessGrantId: authId });
    if (keepIds.length) del.whereNotIn('mediaItemId', keepIds);
    return del.delete(); // empty desired → deletes ALL this auth's grants (correct)
  },
  upsertGrants: async (input: UpsertGrantInput[]) => {
    await database('grant')
      .insert(input)
      .onConflict(['accessGrantId', 'mediaItemId'])
      .merge(['operations', 'updatedBy']);
  },
});
