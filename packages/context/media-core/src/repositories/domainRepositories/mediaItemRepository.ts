import {
  EntityType,
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
  Operation,
  ReactionEmoji,
} from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { ReactionRecord, RequestScopeLifeCycle, UnitOfWork } from '../..';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import {
  isUserAuthRecord,
  UserAuthorizationRecord,
} from '../../domain/Authorization/UserAuthorization';
import { MediaAssetRecord } from '../../domain/MediaItem/MediaAsset';
import {
  MediaItem,
  MediaItemTagRecord,
  type MediaItemRecord,
} from '../../domain/MediaItem/MediaItem';
import type { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export interface MediaItemRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<MediaItem | undefined>;
  save: (mediaItem: MediaItem) => Promise<void>;
  delete: (mediaItem: MediaItem) => Promise<void>;

  ensureUserTagId: (userTag: UserTagRow) => Promise<EntityId>;
}

type MediaItemRepositoryDeps = { uow: UnitOfWork };

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
}: MediaItemRepositoryDeps): MediaItemRepository => {
  const getById = async (id: EntityId): Promise<MediaItem | undefined> => {
    const mediaItemRow = await withEnumRevival(
      uow.db()<MediaItemRecord>('mediaItem').where({ id }).first(),
      { kind: MediaKind, status: MediaItemStatus },
      { strict: true },
    );
    if (!mediaItemRow) {
      return;
    }

    const reactionRows = await withEnumRevival(
      uow
        .db()<ReactionRecord>('reaction')
        .where({ targetId: id, targetType: EntityType.mediaItem })
        .orderBy('createdAt', 'asc'),
      { emoji: ReactionEmoji, targetType: EntityType },
      { strict: true },
    );

    // TODO this is a smell. These should be created by a service but not in the repository.
    // stored on the AR because they are actually never used again.
    const assetRows = await withEnumRevival(
      uow
        .db()<MediaAssetRecord>('mediaAsset')
        .where({ mediaItemId: id })
        .orderBy('createdAt', 'asc'),
      { kind: MediaAssetKind, status: MediaAssetStatus },
      { strict: true },
    );

    const authorizationRows = await withEnumRevival(
      uow
        .db()<AuthorizationRecord>('access_grant')
        .where({ mediaItemId: id })
        .orderBy('createdAt', 'asc'),
      { operations: Operation },
      { strict: true },
    );
    const userAuthorizationRows: UserAuthorizationRecord[] = [];
    for (const row of authorizationRows) {
      if (isUserAuthRecord(row)) userAuthorizationRows.push(row);
      else throw new Error(`Authorization ${row.id} violates grantedToUser XOR linkToken`);
    }

    const tagRows = await uow
      .db()('mediaItemTag')
      .join('userTag', 'mediaItemTag.userTagId', 'userTag.id')
      .where('mediaItemTag.mediaItemId', id)
      .select<MediaItemTagRecord[]>([
        'mediaItemTag.id',
        'mediaItemTag.mediaItemId',
        'userTag.id as userTagId',
        'mediaItemTag.createdBy',
        'mediaItemTag.createdAt',
        'mediaItemTag.updatedBy',
        'mediaItemTag.updatedAt',
        'userTag.label',
      ])
      .orderBy('userTag.label', 'asc');

    const childRecords = {
      assets: assetRows,
      authorizations: userAuthorizationRows,
      tags: tagRows,
      reactions: reactionRows,
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
    await persist(mediaItem, uow);
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
