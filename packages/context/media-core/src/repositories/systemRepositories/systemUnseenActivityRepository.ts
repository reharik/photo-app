import { EntityType, UnseenActivityType } from '@packages/contracts';
import { pickEnum, prepareForDatabase } from '@reharik/smart-enum';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemUnseenActivityRepository = {
  upsertActivityRow: (upsert: UnseenActivity) => Promise<void>;
};

export type SystemUnseenActivityRepositoryDeps = {
  database: Knex;
};
export const UnseenActivityTargetType = pickEnum(EntityType, ['album', 'mediaItem']);
export const UnseenActivitySourceType = pickEnum(EntityType, ['comment', 'mediaItem']);
export type UnseenActivity = {
  id: string;
  viewerId: EntityId;
  targetType: typeof UnseenActivityTargetType;
  targetId: EntityId;
  sourceType: typeof UnseenActivitySourceType;
  sourceId: EntityId;
  activityKind: UnseenActivityType;
};

export const build__SystemUnseenActivityRepository = ({
  database,
}: SystemUnseenActivityRepositoryDeps): SystemUnseenActivityRepository => ({
  upsertActivityRow: async (upsert: UnseenActivity) => {
    await database('unseenActivity')
      .insert(prepareForDatabase({ ...upsert }))
      .onConflict(['viewerId', 'targetType', 'targetId', 'sourceType', 'sourceId'])
      .ignore();
  },
});
