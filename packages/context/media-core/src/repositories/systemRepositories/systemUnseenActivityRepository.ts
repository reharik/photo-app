import { EntityType, UnseenActivityType } from '@packages/contracts';
import { prepareForDatabase } from '@reharik/smart-enum';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemUnseenActivityRepository = {
  upsertActivityRow: (upsert: UnseenActivity) => Promise<number[]>;
  deleteCompletedRecords: (ids: string[]) => Promise<void>;
};

export type SystemUnseenActivityRepositoryDeps = {
  database: Knex;
};

type UnseenActivity = {
  id: string;
  viewerId: EntityId;
  targetType: EntityType;
  targetId: EntityId;
  activityKind: UnseenActivityType;
};
// waiting for query
// const UnseenActivityFields = [
//   'id',
//   'kind',
//   'viewerId',
//   'targetType',
//   'targetId',
//   'unseenActivityType',
// ];

export const build__SystemUnseenActivityRepository = ({
  database,
}: SystemUnseenActivityRepositoryDeps): SystemUnseenActivityRepository => ({
  upsertActivityRow: async (upsert: UnseenActivity) => {
    return database('unseenActivity')
      .insert(prepareForDatabase({ ...upsert }))
      .onConflict(['viewerId', 'targetType', 'targetId', 'activityKind'])
      .ignore();
  },

  deleteCompletedRecords: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) {
      return;
    }
    await database('unseenActivity').delete().whereIn('id', ids);
  },
});
