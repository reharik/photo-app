import type { EntityId } from '@packages/contracts';
import { MediaAssetKind, MediaAssetStatus, MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UnitOfWork } from '../..';
import { MediaAssetRecord } from '../../domain/MediaItem/MediaAsset';
import { MediaItem, type MediaItemRecord } from '../../domain/MediaItem/MediaItem';
import { Persist } from './AggregateRepo';

export interface MediaItemRepository {
  getById: (id: EntityId) => Promise<MediaItem | undefined>;
  save: (mediaItem: MediaItem) => Promise<void>;
  delete: (mediaItem: MediaItem) => Promise<void>;

  ensureUserTagId: (userTag: UserTagRow) => Promise<EntityId>;
}

type MediaItemRepositoryDeps = { uow: UnitOfWork; persist: Persist };

type UserTagRow = {
  id: EntityId;
  userId: EntityId;
  label: string;
  createdBy: EntityId;
  createdAt: Date;
  updatedBy: EntityId;
  updatedAt: Date;
};

export const build__MediaItemRepository = ({
  uow,
  persist,
}: MediaItemRepositoryDeps): MediaItemRepository => {
  const getById = async (id: EntityId): Promise<MediaItem | undefined> => {
    const mediaItemRow = await withEnumRevival(
      uow.db()<MediaItemRecord>('mediaItem').where({ id }).first(),
      { kind: MediaKind, status: MediaItemStatus },
    );
    if (!mediaItemRow) {
      return;
    }

    // TODO this is a smell. These should be created by a service but not in the repository.
    // stored on the AR because they are actually never used again.
    const assetRows = await withEnumRevival(
      uow
        .db()<MediaAssetRecord>('mediaAsset')
        .where({ mediaItemId: id })
        .orderBy('createdAt', 'asc'),
      { kind: MediaAssetKind, status: MediaAssetStatus },
    );

    const childRecords = {
      assets: assetRows,
    };

    return MediaItem.rehydrate(mediaItemRow, childRecords);
  };

  const ensureUserTagId = async (userTag: UserTagRow): Promise<EntityId> => {
    const [row] = await uow
      .db()('user_tag')
      .insert(userTag)
      .onConflict(['userId', 'label'])
      .merge({ updatedAt: new Date() })
      .returning<{ id: EntityId }[]>('id');
    return row.id;
  };

  const save = async (mediaItem: MediaItem): Promise<void> => {
    await persist(mediaItem);
  };

  const deleteMediaItem = async (mediaItem: MediaItem): Promise<void> => {
    return await uow.db()<MediaItemRecord>('mediaItem').where({ id: mediaItem.id() }).delete();
  };

  return {
    getById,
    save,
    delete: deleteMediaItem,
    ensureUserTagId,
  };
};
