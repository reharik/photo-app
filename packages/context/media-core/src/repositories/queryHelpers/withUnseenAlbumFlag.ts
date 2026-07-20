import { EntityType, InAppNotificationType } from '@packages/contracts';
import { Knex } from 'knex';
import { EntityId } from '../../types';

// queryFragments/inAppNotification.ts
export const withUnseenAlbumFlag =
  (db: Knex, viewerId: EntityId, kinds?: InAppNotificationType[]) =>
  (qb: Knex.QueryBuilder): void => {
    qb.select(
      db('inAppNotification as ua')
        .select(db.raw('1'))
        // album-level unseen activity: the container IS the album (container_id === album.id).
        // (was keyed on the now-removed ua.album_id rollup column.)
        .whereRaw('ua.container_id = album.id')
        .where('ua.container_type', EntityType.album.value)
        .where('ua.viewer_id', viewerId)
        .modify((sub) => {
          if (kinds) sub.whereIn('ua.activity_kind', kinds);
        })
        .as('has_unseen'),
    );
  };
