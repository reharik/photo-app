import { AlbumMemberRole } from '@packages/contracts';
import { Knex } from 'knex';

export const withAlbumOwnerName =
  (db: Knex) =>
  (qb: Knex.QueryBuilder): void => {
    qb.leftJoin('albumMember as ownerMember', (join) => {
      join
        .on('ownerMember.albumId', 'album.id')
        .on('ownerMember.role', db.raw('?', [AlbumMemberRole.owner.value]));
    })
      .leftJoin('user as ownerUser', 'ownerUser.id', 'ownerMember.userId')
      .select(['ownerUser.firstName as ownerFirstName', 'ownerUser.lastName as ownerLastName']);
  };
