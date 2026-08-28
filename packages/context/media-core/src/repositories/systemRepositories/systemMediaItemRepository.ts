import { MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UnitOfWork } from '../../infrastructure';
import { EntityId } from '../../types';

export type SystemMediaItemRepository = {
  getMediaItemById: (mediaItemId: EntityId) => Promise<MediaItemOwner>;
};

type SystemMediaItemRepositoryDeps = {
  uow: UnitOfWork;
};

export type MediaItemOwner = {
  id: EntityId;
  ownerId: EntityId;
  kind: MediaKind;
  status: MediaItemStatus;
};
const mediaItemFields = ['id', 'ownerId', 'kind', 'status'];

export const build__SystemMediaItemRepository = ({
  uow,
}: SystemMediaItemRepositoryDeps): SystemMediaItemRepository => ({
  getMediaItemById: async (mediaItemId: EntityId) => {
    await uow.join();
    return await withEnumRevival(
      uow.db()('mediaItem').where({ id: mediaItemId }).first<MediaItemOwner>(mediaItemFields),
      { kind: MediaKind, status: MediaItemStatus },
    );
  },
});
