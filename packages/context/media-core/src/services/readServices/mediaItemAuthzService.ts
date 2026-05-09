import { AlbumMemberRole, ViewerOperation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { EntityId } from '../../types';
import { DecoratedItem, HasId, UnDecoratedItem } from './types';

export type MediaItemPermissionResult = {
  mediaItemId: string;
  viewerOperations: ViewerOperation[];
};

export type MediaItemAuthzService = {
  addAuthzToItems: <T extends HasId>(
    viewerId: EntityId,
    items: UnDecoratedItem<T>[],
  ) => Promise<DecoratedItem<T>[]>;
};

type MediaItemPermissionRow = {
  mediaItemId: EntityId;
  ownerId: EntityId;
  albumRole?: AlbumMemberRole;
  permissions: string;
  // future: locked: boolean;
  // future: allowReshare: boolean;
  // future: albumItemAllowReshare: boolean | null;
};

export const build__MediaItemAuthzService = ({
  database,
}: {
  database: Knex;
}): MediaItemAuthzService => {
  const getAuthzRows = async (
    viewerId: EntityId,
    mediaItemIds: EntityId[],
  ): Promise<MediaItemPermissionRow[]> => {
    return withEnumRevival(
      database<MediaItemPermissionRow>('media_item as mi')
        .leftJoin('album_item as ai', 'ai.media_item_id', 'mi.id')
        .leftJoin('album_member as am', function (this: Knex.JoinClause) {
          this.on('am.album_id', '=', 'ai.album_id').andOnVal('am.user_id', '=', viewerId);
        })
        .whereIn('mi.id', mediaItemIds)
        .select<MediaItemPermissionRow[]>(
          'mi.id as mediaItemId',
          'mi.owner_id as ownerId',
          'am.role as albumRole',
          database.raw(`'' as permissions`),
          // future: 'mi.locked',
          // future: 'mi.allow_reshare as allowReshare',
          // future: 'ai.allow_reshare as albumItemAllowReshare',
        ),
      { albumRole: AlbumMemberRole },
      { strict: true },
    );
  };

  const addAuthzToItems = async <T extends HasId>(
    viewerId: EntityId,
    items: UnDecoratedItem<T>[],
  ): Promise<DecoratedItem<T>[]> => {
    if (items.length === 0) return [];

    const permissions = await getAuthzRows(
      viewerId,
      items.map<string>((i) => i.id),
    );
    const addItem = <T>(x: T, arr: T[]) => {
      if (!arr.includes(x)) {
        arr.push(x);
      }
      return arr;
    };
    // Here we create a map of permissions for each media item
    // The complexity is that a media item can have multiple records
    // returned by the query and we need to collect the distinct set of viewerOperations
    const decoratedItems = permissions.reduce<Record<string, DecoratedItem<T>>>(
      (acc, row) => {
        // If we have processed a permission for this item before get it from acc
        // otherwise find the item in the original items array and add the empty operations set
        let mediaItem = acc[row.mediaItemId];
        if (!mediaItem) {
          const mediaItemRow = items.find((i) => i.id === row.mediaItemId);
          if (!mediaItemRow) {
            return acc;
          }
          mediaItem = { ...mediaItemRow, viewerOperations: [], viewerIsOwner: false };
        }

        // now that we have the media item with the operations so far, we add the
        // new operations from this permission;
        if (row.ownerId === viewerId) {
          ViewerOperation.items().forEach((op) => addItem(op, mediaItem.viewerOperations));
        } else if (row.albumRole) {
          const role = row.albumRole;
          role.operations.forEach((op) => addItem(op, mediaItem.viewerOperations));
        }
        mediaItem.viewerIsOwner = row.ownerId === viewerId;
        // assign or reassign the media item back to the acc
        acc[row.mediaItemId] = mediaItem;
        return acc;
      },
      {} as Record<string, DecoratedItem<T>>,
    );

    return Object.values(decoratedItems);
  };

  return {
    addAuthzToItems,
  };
};
