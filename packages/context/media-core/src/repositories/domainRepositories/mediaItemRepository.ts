import {
  CommentTargetType,
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
  SharePermission,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { buildMediaItemBaseStorageKey } from '../../application/media/MediaStorage';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import type { CommentRecord } from '../../domain/Comment/Comment';
import { MediaAssetRecord } from '../../domain/MediaItem/MediaAsset';
import { MediaItem, type MediaItemRecord } from '../../domain/MediaItem/MediaItem';
import { mediaItemTagLabelKey } from '../../domain/MediaItem/MediaItemTag';
import {
  type DbExecutor,
  RepoOptions,
  runInTransaction,
} from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

export type MediaItemRepository = {
  getById: (id: EntityId) => Promise<MediaItem | undefined>;
  save: (mediaItem: MediaItem, options?: RepoOptions) => Promise<void>;
  delete: (mediaItem: MediaItem, options?: RepoOptions) => Promise<void>;
};

type MediaItemRepositoryDeps = { database: Knex };

type UserTagRow = {
  id: EntityId;
  userId: EntityId;
  label: string;
  labelKey: string;
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
      { permission: SharePermission },
      { strict: true },
    );

    const tagLabelRows = await database('mediaItemTag')
      .join('userTag', 'mediaItemTag.userTagId', 'userTag.id')
      .where('mediaItemTag.mediaItemId', id)
      .select<{ label: string }[]>('userTag.label')
      .orderBy('userTag.label', 'asc');

    mediaItemRow.comments = commentRows;
    mediaItemRow.assets = assetRows;
    mediaItemRow.authorizations = authorizationRows;
    mediaItemRow.tags = tagLabelRows.map((r) => r.label);
    return MediaItem.rehydrate(mediaItemRow);
  };

  const ensureUserTagId = async (
    trx: DbExecutor,
    { userId, label, actorId }: { userId: EntityId; label: string; actorId: EntityId },
  ): Promise<EntityId> => {
    const labelKey = mediaItemTagLabelKey(label);
    const existing = await trx<UserTagRow>('userTag').where({ userId, labelKey }).first();
    if (existing) {
      return existing.id;
    }
    const id = crypto.randomUUID();
    const now = new Date();
    try {
      await trx('userTag').insert({
        id,
        userId,
        label,
        labelKey,
        createdAt: now,
        updatedAt: now,
        createdBy: actorId,
        updatedBy: actorId,
      });
      return id;
    } catch (err: unknown) {
      const retry = await trx<UserTagRow>('userTag').where({ userId, labelKey }).first();
      if (retry) {
        return retry.id;
      }
      throw err;
    }
  };

  const save = async (mediaItem: MediaItem, options?: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      const record = mediaItem.toPersistence();
      const { comments, assets, authorizations, tags: tagLabels, ...mediaItemRow } = record;
      const rowForDb = {
        ...mediaItemRow,
        storageKey: buildMediaItemBaseStorageKey(record.ownerId, record.id),
      };

      const existing = await trx<MediaItemRecord>('mediaItem').where({ id: record.id }).first();

      if (existing) {
        await trx<MediaItemRecord>('mediaItem').where({ id: record.id }).update(rowForDb);
      } else {
        await trx('mediaItem').insert(rowForDb);
      }

      await trx('comment')
        .where({ targetType: CommentTargetType.mediaItem, targetId: record.id })
        .delete();

      if (comments.length > 0) {
        await trx('comment').insert(comments);
      }

      if (assets.length > 0) {
        const assetRows = assets.map((asset) => ({
          ...asset,
          mediaItemId: record.id,
        }));
        await trx('mediaAsset').insert(assetRows).onConflict(['media_item_id', 'kind']).merge();
      }

      if (authorizations.length > 0) {
        const authorizationRows = authorizations.map((authorization) => ({
          ...authorization,
          mediaItemId: record.id,
        }));
        await trx('access_grant')
          .insert(authorizationRows)
          .onConflict(['media_item_id', 'granted_to_user'])
          .merge();
      }

      await trx('mediaItemTag').where({ mediaItemId: record.id }).delete();

      const ownerId = record.ownerId;
      const actorId = record.updatedBy;
      const now = new Date();

      for (const label of tagLabels) {
        const userTagId = await ensureUserTagId(trx, {
          userId: ownerId,
          label,
          actorId,
        });
        await trx('mediaItemTag').insert({
          id: crypto.randomUUID(),
          mediaItemId: record.id,
          userTagId,
          createdAt: now,
          updatedAt: now,
          createdBy: actorId,
          updatedBy: actorId,
        });
      }
    });
  };

  const deleteMediaItem = async (
    mediaItem: MediaItem,
    options: RepoOptions = {},
  ): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      return await trx<MediaItemRecord>('mediaItem').where({ id: mediaItem.id() }).delete();
    });
  };

  return {
    getById,
    save,
    delete: deleteMediaItem,
  };
};
