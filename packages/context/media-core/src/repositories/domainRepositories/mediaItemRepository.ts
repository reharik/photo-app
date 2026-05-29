import {
  CommentTargetType,
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
  Operation,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { DBReactionCounts } from '../..';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import type { CommentRecord } from '../../domain/Comment/Comment';
import { MediaAssetRecord } from '../../domain/MediaItem/MediaAsset';
import {
  MediaItem,
  MediaItemTagRecord,
  type MediaItemRecord,
} from '../../domain/MediaItem/MediaItem';
import {
  RepoOptions,
  runInTransaction,
  type DbExecutor,
} from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export type MediaItemRepository = {
  getById: (id: EntityId) => Promise<MediaItem | undefined>;
  save: (mediaItem: MediaItem, trx: Knex.Transaction) => Promise<void>;
  delete: (mediaItem: MediaItem, options?: RepoOptions) => Promise<void>;
  updateReactionCounts(
    mediaItemId: EntityId,
    reactionCounts: DBReactionCounts,
    options?: RepoOptions,
  ): Promise<void>;
  ensureUserTagId: (trx: DbExecutor, userTag: UserTagRow) => Promise<EntityId>;
};

type MediaItemRepositoryDeps = { database: Knex };

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
  database,
}: MediaItemRepositoryDeps): MediaItemRepository => {
  const getById = async (id: EntityId): Promise<MediaItem | undefined> => {
    const mediaItemRow = await withEnumRevival(
      database<MediaItemRecord>('mediaItem').where({ id }).first(),
      { kind: MediaKind, status: MediaItemStatus },
      { strict: true },
    );
    if (!mediaItemRow) {
      return;
    }

    const commentRows = await withEnumRevival(
      database<CommentRecord>('comment')
        .where({ targetType: CommentTargetType.mediaItem, targetId: id })
        .orderBy('createdAt', 'asc'),
      { targetType: CommentTargetType },
      { strict: true },
    );
    // TODO this is a smell. These should be created by a service but not in the repository.
    // stored on the AR because they are actually never used again.
    const assetRows = await withEnumRevival(
      database<MediaAssetRecord>('mediaAsset')
        .where({ mediaItemId: id })
        .orderBy('createdAt', 'asc'),
      { kind: MediaAssetKind, status: MediaAssetStatus },
      { strict: true },
    );

    const authorizationRows = await withEnumRevival(
      database<AuthorizationRecord>('access_grant')
        .where({ mediaItemId: id })
        .orderBy('createdAt', 'asc'),
      { operations: Operation },
      { strict: true },
    );

    const tagRows = await database('mediaItemTag')
      .join('userTag', 'mediaItemTag.userTagId', 'userTag.id')
      .where('mediaItemTag.mediaItemId', id)
      .select<
        MediaItemTagRecord[]
      >(['mediaItemTag.id', 'mediaItemTag.mediaItemId', 'userTag.id as userTagId', 'mediaItemTag.createdBy', 'mediaItemTag.createdAt', 'mediaItemTag.updatedBy', 'mediaItemTag.updatedAt', 'userTag.label'])
      .orderBy('userTag.label', 'asc');

    const childRecords = {
      comments: commentRows,
      assets: assetRows,
      authorizations: authorizationRows,
      tags: tagRows,
    };

    return MediaItem.rehydrate(mediaItemRow, childRecords);
  };

  const ensureUserTagId = async (trx: DbExecutor, userTag: UserTagRow): Promise<EntityId> => {
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

  const deleteMediaItem = async (
    mediaItem: MediaItem,
    options: RepoOptions = {},
  ): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      return await trx<MediaItemRecord>('mediaItem').where({ id: mediaItem.id() }).delete();
    });
  };
  const updateReactionCounts = async (
    mediaItemId: EntityId,
    reactionCounts: DBReactionCounts,
    options?: RepoOptions,
  ): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      await trx('mediaItem').where({ id: mediaItemId }).update({ reactionCounts });
    });
  };

  return {
    getById,
    save,
    delete: deleteMediaItem,
    updateReactionCounts,
    ensureUserTagId,
  };
};
