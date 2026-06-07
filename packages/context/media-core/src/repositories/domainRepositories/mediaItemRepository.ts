import {
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
  Operation,
  ReactionEmoji,
  ReactionTargetType,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { ReactionRecord } from '../..';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import { MediaAssetRecord } from '../../domain/MediaItem/MediaAsset';
import {
  MediaItem,
  MediaItemTagRecord,
  type MediaItemRecord,
} from '../../domain/MediaItem/MediaItem';
import { RunInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export type MediaItemRepository = {
  getById: (id: EntityId, trx?: Knex.Transaction) => Promise<MediaItem | undefined>;
  save: (mediaItem: MediaItem, trx: Knex.Transaction) => Promise<void>;
  delete: (mediaItem: MediaItem, trx: Knex.Transaction) => Promise<void>;

  ensureUserTagId: (userTag: UserTagRow, trx: Knex.Transaction) => Promise<EntityId>;
};

type MediaItemRepositoryDeps = { runInTransaction: RunInTransaction };

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
  runInTransaction,
}: MediaItemRepositoryDeps): MediaItemRepository => {
  const getById = async (id: EntityId, trx?: Knex.Transaction): Promise<MediaItem | undefined> => {
    return await runInTransaction(trx, async (db) => {
      const mediaItemRow = await withEnumRevival(
        db<MediaItemRecord>('mediaItem').where({ id }).first(),
        { kind: MediaKind, status: MediaItemStatus },
        { strict: true },
      );
      if (!mediaItemRow) {
        return;
      }

      const reactionRows = await withEnumRevival(
        db<ReactionRecord>('reaction')
          .where({ targetId: id, targetType: ReactionTargetType.mediaItem })
          .orderBy('createdAt', 'asc'),
        { emoji: ReactionEmoji, targetType: ReactionTargetType },
        { strict: true },
      );

      // TODO this is a smell. These should be created by a service but not in the repository.
      // stored on the AR because they are actually never used again.
      const assetRows = await withEnumRevival(
        db<MediaAssetRecord>('mediaAsset').where({ mediaItemId: id }).orderBy('createdAt', 'asc'),
        { kind: MediaAssetKind, status: MediaAssetStatus },
        { strict: true },
      );

      const authorizationRows = await withEnumRevival(
        db<AuthorizationRecord>('access_grant')
          .where({ mediaItemId: id })
          .orderBy('createdAt', 'asc'),
        { operations: Operation },
        { strict: true },
      );

      const tagRows = await db('mediaItemTag')
        .join('userTag', 'mediaItemTag.userTagId', 'userTag.id')
        .where('mediaItemTag.mediaItemId', id)
        .select<
          MediaItemTagRecord[]
        >(['mediaItemTag.id', 'mediaItemTag.mediaItemId', 'userTag.id as userTagId', 'mediaItemTag.createdBy', 'mediaItemTag.createdAt', 'mediaItemTag.updatedBy', 'mediaItemTag.updatedAt', 'userTag.label'])
        .orderBy('userTag.label', 'asc');

      const childRecords = {
        assets: assetRows,
        authorizations: authorizationRows,
        tags: tagRows,
        reactions: reactionRows,
      };

      return MediaItem.rehydrate(mediaItemRow, childRecords);
    });
  };

  const ensureUserTagId = async (userTag: UserTagRow, trx: Knex.Transaction): Promise<EntityId> => {
    const [row] = await trx('user_tag')
      .insert(userTag)
      .onConflict(['userId', 'label'])
      .merge({ updatedAt: new Date() })
      .returning<{ id: EntityId }[]>('id');
    return row.id;
  };

  const save = async (mediaItem: MediaItem, trx: Knex.Transaction): Promise<void> => {
    await persist(trx, mediaItem);
  };

  const deleteMediaItem = async (mediaItem: MediaItem, trx: Knex.Transaction): Promise<void> => {
    return await trx<MediaItemRecord>('mediaItem').where({ id: mediaItem.id() }).delete();
  };

  return {
    getById,
    save,
    delete: deleteMediaItem,
    ensureUserTagId,
  };
};
