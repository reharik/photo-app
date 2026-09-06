import { AlbumMemberRole, assertNever, AuthorizationKind, Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Album, type AlbumRecord } from '../../domain/Album/Album';
import type { AlbumItemRecord } from '../../domain/Album/AlbumItem';
import type { AlbumMemberRecord } from '../../domain/Album/AlbumMember';
import {
  AnyAuthorizationRecord,
  isAuthorizationRecordKind,
} from '../../domain/Authorization/Authorization';
import { PendingUserAuthorizationRecord } from '../../domain/Authorization/PendingUserAuthorization';
import { PublicLinkAuthorizationRecord } from '../../domain/Authorization/PublicLinkAuthorization';
import { UserAuthorizationRecord } from '../../domain/Authorization/UserAuthorization';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types/types';
import { withLiveAuthorizationFilter } from '../queryHelpers';
import { Persist } from './AggregateRepo';

export interface AlbumRepository extends RequestScopeLifeCycle {
  getById: (id: EntityId) => Promise<Album | undefined>;
  save: (album: Album) => Promise<void>;
  delete: (album: Album) => Promise<void>;
}

type AlbumRepositoryDeps = {
  uow: UnitOfWork;
  persist: Persist;
};

export const build__AlbumRepository = ({ uow, persist }: AlbumRepositoryDeps): AlbumRepository => {
  const getById = async (id: EntityId): Promise<Album | undefined> => {
    await uow.join();
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
    );

    const authorizationRows = await withEnumRevival(
      uow
        .db()('access_grant')
        .where({ albumId: id })
        // .modify()'s type params don't infer from the receiver; without them the row type
        // erases to `any` and withEnumRevival stops checking mapping keys.
        .modify<AnyAuthorizationRecord, AnyAuthorizationRecord[]>(
          withLiveAuthorizationFilter(uow.db()),
        )
        .orderBy('createdAt', 'asc'),
      { operations: Operation, kind: AuthorizationKind },
    );

    const userAuthorizationRows: UserAuthorizationRecord[] = [];
    const publicLinkRows: PublicLinkAuthorizationRecord[] = [];
    const pendingUserAuthorizationRows: PendingUserAuthorizationRecord[] = [];

    // See isAuthorizationRecordKind for why a predicate and not `kind.value ===`. The
    // `const _n: never` alarm is the point: a fourth kind stops compiling here instead of
    // being partitioned into nothing, which is what the old cast-per-branch version did.
    for (const row of authorizationRows) {
      if (isAuthorizationRecordKind(row, 'USER')) {
        userAuthorizationRows.push(row);
      } else if (isAuthorizationRecordKind(row, 'PENDING')) {
        pendingUserAuthorizationRows.push(row);
      } else if (isAuthorizationRecordKind(row, 'PUBLIC')) {
        publicLinkRows.push(row);
      } else {
        const _n: never = row;
        return assertNever(_n);
      }
    }

    return Album.rehydrate(albumRow, {
      items: itemRows,
      members: memberRows,
      authorizations: userAuthorizationRows,
      pendingUserAuthorizations: pendingUserAuthorizationRows,
      publicLinks: publicLinkRows,
    });
  };

  const save = async (album: Album): Promise<void> => {
    await persist(album);
  };

  const deleteAlbum = async (album: Album): Promise<void> => {
    await uow.join();
    await uow.db()<AlbumRecord>('album').where({ id: album.id() }).delete();
  };

  return {
    getById,
    save,
    delete: deleteAlbum,
  };
};
