import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemMediaItemRepository = {
  getMediaItemById: (mediaItemId: EntityId) => Promise<MediaItemOwner>;
};

type SystemMediaItemRepositoryDeps = {
  database: Knex;
};

export type MediaItemOwner = {
  id: EntityId;
  ownerId: EntityId;
};
const mediaItemFields = ['id', 'ownerId'];

export const build__SystemMediaItemRepository = ({
  database,
}: SystemMediaItemRepositoryDeps): SystemMediaItemRepository => ({
  getMediaItemById: async (mediaItemId: EntityId) => {
    return database('mediaItem').where({ id: mediaItemId }).first<MediaItemOwner>(mediaItemFields);
  },
});
