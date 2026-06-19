import { AlbumMemberRole, Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { Album, type AlbumRecord } from '../../domain/Album/Album';
import type { AlbumItemRecord } from '../../domain/Album/AlbumItem';
import type { AlbumMemberRecord } from '../../domain/Album/AlbumMember';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import { RunInTransaction } from '../../infrastructure/repositories/runInTransaction';
import { EntityId } from '../../types/types';
import { GrantSync } from '../grantSync';
import { persist } from './AggregateRepo';
import {
  publicLinkSelectColumns,
  PublicLinkWithAuthorizationRaw,
  publicLinkWithAuthorizationRawToPublicLink,
} from './albumRepositoryMappings';
import { GrantRepository } from './grantRepository';

export type AlbumRepository = {
  getById: (id: EntityId, trx?: Knex.Transaction) => Promise<Album | undefined>;
  save: (album: Album, trx: Knex.Transaction) => Promise<void>;
  delete: (album: Album, trx: Knex.Transaction) => Promise<void>;
};

type AlbumRepositoryDeps = {
  database: Knex;
  runInTransaction: RunInTransaction;
  grantRepository: GrantRepository;
  grantSync: GrantSync;
};

export const build__AlbumRepository = ({
  runInTransaction,
  grantSync,
}: AlbumRepositoryDeps): AlbumRepository => {
  const getById = async (id: EntityId, trx?: Knex.Transaction): Promise<Album | undefined> => {
    return runInTransaction(trx, async (db) => {
      const albumRow = await db<AlbumRecord>('album').where({ id }).first();
      if (!albumRow) return undefined;

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
        db<AuthorizationRecord>('access_grant').where({ albumId: id }).orderBy('createdAt', 'asc'),
        { operation: Operation },
        { strict: true },
      );

      const publicLinkRows = await withEnumRevival(
        db('share_link')
          .innerJoin('access_grant', 'share_link.id', 'access_grant.share_link_id')
          .select<PublicLinkWithAuthorizationRaw[]>(...publicLinkSelectColumns)
          .where({ 'share_link.albumId': id })
          .orderBy('share_link.createdAt', 'asc'),
        { operation: Operation },
        { strict: true },
      );

      const publicLinks = publicLinkRows.map(publicLinkWithAuthorizationRawToPublicLink);

      return Album.rehydrate(albumRow, {
        items: itemRows,
        members: memberRows,
        authorizations: authorizationRows,
        publicLinks,
      });
    });
  };

  const save = async (album: Album, trx: Knex.Transaction): Promise<void> => {
    await persist(trx, album);
    await grantSync.syncGrants(album, trx);
  };

  const deleteAlbum = async (album: Album, trx: Knex.Transaction): Promise<void> => {
    await trx<AlbumRecord>('album').where({ id: album.id() }).delete();
  };

  return {
    getById,
    save,
    delete: deleteAlbum,
  };
};
