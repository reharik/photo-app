import { MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
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
  kind: MediaKind;
  status: MediaItemStatus;
};
const mediaItemFields = ['id', 'ownerId', 'kind', 'status'];

export const build__SystemMediaItemRepository = ({
  database,
}: SystemMediaItemRepositoryDeps): SystemMediaItemRepository => ({
  getMediaItemById: async (mediaItemId: EntityId) => {
    return await withEnumRevival(
      database('mediaItem').where({ id: mediaItemId }).first<MediaItemOwner>(mediaItemFields),
      { kind: MediaKind, status: MediaItemStatus },
    );
  },
});
