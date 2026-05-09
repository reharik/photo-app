import { AlbumMemberRole, SharePermission } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { Album, type AlbumRecord } from '../../domain/Album/Album';
import type { AlbumItemRecord } from '../../domain/Album/AlbumItem';
import type { AlbumMemberRecord } from '../../domain/Album/AlbumMember';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import { PublicLinkRecord } from '../../domain/PublicLink/PublicLink';
import { stampAudit } from '../../domain/utilities/stampAudit';
import { diffCollectionById } from '../../infrastructure/repositories/diffCollectionById';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import { EntityId } from '../../types/types';

export type AlbumRepository = {
  getById: (id: EntityId, options?: RepoOptions) => Promise<Album | undefined>;
  save: (album: Album, viewerId: EntityId, options?: RepoOptions) => Promise<void>;
  delete: (album: Album, options?: RepoOptions) => Promise<void>;
};

type AlbumRepositoryDeps = {
  database: Knex;
};

export const build__AlbumRepository = ({ database }: AlbumRepositoryDeps): AlbumRepository => {
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
    const authorizationRows = await withEnumRevival(
      database<AuthorizationRecord>('access_grant')
        .where({ albumId: id })
        .orderBy('createdAt', 'asc'),
      { permission: SharePermission },
      { strict: true },
    );
    const publicLinkRows = await withEnumRevival(
      database<PublicLinkRecord>('share_link').where({ albumId: id }).orderBy('createdAt', 'asc'),
      { permission: SharePermission },
      { strict: true },
    );

    albumRow.items = itemRows;
    albumRow.members = memberRows;
    albumRow.authorizations = authorizationRows;
    albumRow.publicLinks = publicLinkRows;

    return Album.rehydrate(albumRow);
  };

  const save = async (album: Album, viewerId: EntityId, options?: RepoOptions): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      const record = album.toPersistence();
      const { items, members, authorizations, publicLinks, ...albumRow } = record;

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
      if (authorizations.length > 0) {
        const authorizationRows = authorizations.map((authorization) => ({
          ...authorization,
          albumId: record.id,
        }));
        await trx('access_grant')
          .insert(authorizationRows)
          .onConflict(['album_id', 'granted_to_user'])
          .merge();
      }
      if (publicLinks.length > 0) {
        const linkRows: Omit<PublicLinkRecord, 'authorization'>[] = [];
        const authorizationRows: (Omit<AuthorizationRecord, 'publicLinkId' | 'id'> & {
          id?: string;
          shareLinkId?: string;
        })[] = [];
        publicLinks.forEach((publicLink) => {
          const { authorization, ...publicLinkRow } = publicLink;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { publicLinkId, ...authorizationRow } = authorization;
          const stamped = stampAudit(publicLinkRow, viewerId);
          linkRows.push({
            ...stamped,
            albumId: record.id,
          });
          authorizationRows.push(
            stampAudit(
              {
                ...authorizationRow,
                albumId: record.id,
                shareLinkId: publicLink.id,
              },
              viewerId,
            ),
          );
        });
        await trx('share_link')
          .insert<Omit<PublicLinkRecord, 'authorization'>>(linkRows)
          .onConflict('link_token')
          .merge();
        await trx('access_grant')
          .insert<
            Omit<AuthorizationRecord, 'id'> & {
              id?: string;
              shareLinkId?: string;
            }
          >(authorizationRows)
          .onConflict(['share_link_id'])
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
