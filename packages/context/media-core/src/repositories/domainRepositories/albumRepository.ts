import { AlbumMemberRole, Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Album, type AlbumRecord } from '../../domain/Album/Album';
import type { AlbumItemRecord } from '../../domain/Album/AlbumItem';
import type { AlbumMemberRecord } from '../../domain/Album/AlbumMember';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types/types';
import { GrantSync } from '../grantSync';
import { persist } from './AggregateRepo';
import {
  publicLinkSelectColumns,
  PublicLinkWithAuthorizationRaw,
  publicLinkWithAuthorizationRawToPublicLink,
} from './albumRepositoryMappings';

export interface AlbumRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<Album | undefined>;
  save: (album: Album) => Promise<void>;
  delete: (album: Album) => Promise<void>;
}

type AlbumRepositoryDeps = {
  uow: UnitOfWork;
  grantSync: GrantSync;
};

export const build__AlbumRepository = ({
  grantSync,
  uow,
}: AlbumRepositoryDeps): AlbumRepository => {
  const getById = async (id: EntityId): Promise<Album | undefined> => {
    const albumRow = await uow.db()<AlbumRecord>('album').where({ id }).first();
    if (!albumRow) return undefined;

    const itemRows = await uow
      .db()<AlbumItemRecord>('albumItem')
      .where({ albumId: id })
      .orderBy('orderIndex', 'asc')
      .orderBy('id', 'asc');

    const memberRows = await withEnumRevival(
      uow.db()<AlbumMemberRecord>('albumMember').where({ albumId: id }).orderBy('createdAt', 'asc'),
      { role: AlbumMemberRole },
      { strict: true },
    );

    const authorizationRows = await withEnumRevival(
      uow
        .db()<AuthorizationRecord>('access_grant')
        .where({ albumId: id })
        .orderBy('createdAt', 'asc'),
      { operation: Operation },
      { strict: true },
    );

    const publicLinkRows = await withEnumRevival(
      uow
        .db()('share_link')
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
  };

  const save = async (album: Album): Promise<void> => {
    await persist(album, uow);
    await grantSync.syncGrants(album);
  };

  const deleteAlbum = async (album: Album): Promise<void> => {
    await uow.db()<AlbumRecord>('album').where({ id: album.id() }).delete();
  };

  return {
    getById,
    save,
    delete: deleteAlbum,
  };
};
