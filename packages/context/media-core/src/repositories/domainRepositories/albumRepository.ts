import { AlbumMemberRole, SharePermission } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { Album, type AlbumRecord } from '../../domain/Album/Album';
import type { AlbumItemRecord } from '../../domain/Album/AlbumItem';
import type { AlbumMemberRecord } from '../../domain/Album/AlbumMember';
import { ShareRecord } from '../../domain/Share/Share';
import { diffCollectionById } from '../../infrastructure/repositories/diffCollectionById';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import { EntityId } from '../../types/types';

export type AlbumRepository = {
  getById: (id: EntityId, options?: RepoOptions) => Promise<Album | undefined>;
  save: (album: Album, options?: RepoOptions) => Promise<void>;
  delete: (album: Album, options?: RepoOptions) => Promise<void>;
};

type AlbumRepositoryDeps = {
  database: Knex;
};

export const buildAlbumRepository = ({ database }: AlbumRepositoryDeps): AlbumRepository => {
  const getById = async (id: EntityId, options?: RepoOptions): Promise<Album | undefined> => {
    const db = options?.trx ?? database;
    const albumRow = await db<AlbumRecord>('album').where({ id }).first();

    if (!albumRow) {
      return;
    }

    const itemRows = await db<AlbumItemRecord>('albumItem')
      .where({ albumId: id })
      .orderBy('orderIndex', 'asc')
      .orderBy('id', 'asc');

    const memberRows = await withEnumRevival(
      db<AlbumMemberRecord>('albumMember').where({ albumId: id }).orderBy('createdAt', 'asc'),
      { role: AlbumMemberRole },
      { strict: true },
    );
    const shareRows = await withEnumRevival(
      database<ShareRecord>('access_grant').where({ albumId: id }).orderBy('createdAt', 'asc'),
      { permission: SharePermission },
      { strict: true },
    );

    albumRow.items = itemRows;
    albumRow.members = memberRows;
    albumRow.shares = shareRows;

    return Album.rehydrate(albumRow);
  };

  const save = async (album: Album, options?: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      const record = album.toPersistence();
      const { items, members, shares, ...albumRow } = record;

      const existing = await trx<AlbumRecord>('album').where({ id: record.id }).first();
      if (!record.coverMediaId && existing?.coverMediaId) {
        albumRow.coverMediaId = null;
      }
      if (existing) {
        await trx<AlbumRecord>('album').where({ id: record.id }).update(albumRow);
      } else {
        await trx<AlbumRecord>('album').insert(albumRow);
      }

      await persistAlbumItems(trx, record, items);

      await trx<AlbumMemberRecord>('albumMember').where({ albumId: record.id }).delete();
      if (members.length > 0) {
        await trx<AlbumMemberRecord>('albumMember').insert(
          members.map((member) => ({
            ...member,
            albumId: record.id,
          })),
        );
      }
      if (shares.length > 0) {
        const shareRows = shares.map((share) => ({
          ...share,
          albumId: record.id,
        }));
        await trx('access_grant')
          .insert(shareRows)
          .onConflict(['album_id', 'granted_to_user'])
          .merge();
      }
    });
  };

  const deleteAlbum = async (album: Album, options?: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (db) => {
      await db<AlbumRecord>('album').where({ id: album.id() }).delete();
    });
  };

  return {
    getById,
    save,
    delete: deleteAlbum,
  };
};

const persistAlbumItems = async (
  trx: Knex | Knex.Transaction,
  record: AlbumRecord,
  items: AlbumItemRecord[],
) => {
  const existingItems = await trx<AlbumItemRecord>('albumItem').where({ albumId: record.id });
  const { toInsert, toDelete, toUpdate } = diffCollectionById(existingItems, items, {
    hasMeaningfulChanges: (existing, item) =>
      existing.mediaItemId !== item.mediaItemId ||
      String(existing.orderIndex ?? '') !== String(item.orderIndex ?? ''),
  });

  if (toDelete.length > 0) {
    await trx<AlbumItemRecord>('albumItem')
      .whereIn(
        'id',
        toDelete.map((item) => item.id),
      )
      .delete();
  }

  if (toInsert.length > 0) {
    await trx<AlbumItemRecord>('albumItem').insert(
      toInsert.map((item) => ({
        ...item,
        albumId: record.id,
      })),
    );
  }

  for (const { item } of toUpdate) {
    await trx<AlbumItemRecord>('albumItem').where({ id: item.id }).update({
      mediaItemId: item.mediaItemId,
      orderIndex: item.orderIndex,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
    });
  }
};
