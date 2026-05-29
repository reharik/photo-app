import { AlbumMemberRole, Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { Album, type AlbumRecord } from '../../domain/Album/Album';
import type { AlbumItemRecord } from '../../domain/Album/AlbumItem';
import type { AlbumMemberRecord } from '../../domain/Album/AlbumMember';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';
import {
  publicLinkSelectColumns,
  PublicLinkWithAuthorizationRaw,
  publicLinkWithAuthorizationRawToPublicLink,
} from './albumRepositoryMappings';

export type AlbumRepository = {
  getById: (id: EntityId, options?: RepoOptions) => Promise<Album | undefined>;
  save: (album: Album, trx: Knex.Transaction) => Promise<void>;
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
      { operation: Operation },
      { strict: true },
    );
    const publicLinkRows = await withEnumRevival(
      database('share_link')
        .innerJoin('access_grant', 'share_link.id', 'access_grant.share_link_id')
        .select<PublicLinkWithAuthorizationRaw[]>(...publicLinkSelectColumns)
        .where({ 'share_link.albumId': id })
        .orderBy('share_link.createdAt', 'asc'),
      { operation: Operation },
      { strict: true },
    );

    const publicLinks = publicLinkRows.map((row) =>
      publicLinkWithAuthorizationRawToPublicLink(row),
    );

    const childRecords = {
      items: itemRows,
      members: memberRows,
      authorizations: authorizationRows,
      publicLinks: publicLinks,
    };
    return Album.rehydrate(albumRow, childRecords);
  };

  const save = async (album: Album, trx: Knex.Transaction): Promise<void> => {
    await persist(trx, album);
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
