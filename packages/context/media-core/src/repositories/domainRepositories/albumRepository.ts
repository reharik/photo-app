import { AlbumMemberRole, Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Album, type AlbumRecord } from '../../domain/Album/Album';
import type { AlbumItemRecord } from '../../domain/Album/AlbumItem';
import type { AlbumMemberRecord } from '../../domain/Album/AlbumMember';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';
import {
  isPublicLinkAuthRecord,
  PublicLinkAuthorizationRecord,
} from '../../domain/Authorization/PublicLinkAuthorization';
import {
  isUserAuthRecord,
  UserAuthorizationRecord,
} from '../../domain/Authorization/UserAuthorization';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types/types';
import { persist } from './AggregateRepo';

export interface AlbumRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<Album | undefined>;
  save: (album: Album) => Promise<void>;
  delete: (album: Album) => Promise<void>;
}

type AlbumRepositoryDeps = {
  uow: UnitOfWork;
};

export const build__AlbumRepository = ({ uow }: AlbumRepositoryDeps): AlbumRepository => {
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

    const userAuthorizationRows: UserAuthorizationRecord[] = [];
    const publicLinkRows: PublicLinkAuthorizationRecord[] = [];

    for (const row of authorizationRows) {
      if (isUserAuthRecord(row)) userAuthorizationRows.push(row);
      else if (isPublicLinkAuthRecord(row)) publicLinkRows.push(row);
      else throw new Error(`Authorization ${row.id} violates grantedToUser XOR linkToken`);
    }

    return Album.rehydrate(albumRow, {
      items: itemRows,
      members: memberRows,
      authorizations: userAuthorizationRows,
      publicLinks: publicLinkRows,
    });
  };

  const save = async (album: Album): Promise<void> => {
    await persist(album, uow);
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
