import { AlbumMemberRole, ViewerOperation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { AuthorizationReadRepository } from '../../../repositories/readRepositories/authorizationReadRepository';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { DecoratedItem, HasId, UnDecoratedItem } from './viewerReadService.types';
import { AuthorizationProjection } from './viewerSharedWithMeMediaItemReadService';

export type MediaItemPermissionResult = {
  mediaItemId: string;
  viewerOperations: ViewerOperation[];
};

export type ViewerMediaItemAuthzService = {
  addAuthzToItems: <T extends HasId>(items: UnDecoratedItem<T>[]) => Promise<DecoratedItem<T>[]>;

  listGrantedAuthorizationsForOwnedMediaItem: (
    mediaItemId: EntityId,
  ) => Promise<AuthorizationProjection[]>;
};

export interface ViewerMediaItemAuthzServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ViewerMediaItemAuthzService;
}

type MediaItemPermissionRow = {
  mediaItemId: EntityId;
  ownerId: EntityId;
  albumRole?: AlbumMemberRole;
  // future: locked: boolean;
  // future: allowReshare: boolean;
  // future: albumItemAllowReshare: boolean | null;
};

export const build__ViewerMediaItemAuthzServiceFactory = ({
  database,
  authorizationReadRepository,
}: {
  database: Knex;
  authorizationReadRepository: AuthorizationReadRepository;
}): ViewerMediaItemAuthzServiceFactory => {
  return ({ viewerId }: { viewerId: string }): ViewerMediaItemAuthzService => {
    const listGrantedAuthorizationsForOwnedMediaItem = async (
      mediaItemId: EntityId,
    ): Promise<AuthorizationProjection[]> => {
      const rows = await authorizationReadRepository.getGrantedAuthorizationsForOwnedMediaItem({
        mediaItemId,
        ownerId: viewerId,
      });
      return rows.map((row) => ({
        id: row.id,
        grantedToUserId: row.grantedToUser,
        permission: row.permission,
        label: row.description,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      }));
    };
    const getAuthzRows = async (mediaItemIds: EntityId[]): Promise<MediaItemPermissionRow[]> => {
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
            // future: 'mi.locked',
            // future: 'mi.allow_reshare as allowReshare',
            // future: 'ai.allow_reshare as albumItemAllowReshare',
          ),
        { albumRole: AlbumMemberRole },
        { strict: true },
      );
    };

    const addAuthzToItems = async <T extends HasId>(
      items: UnDecoratedItem<T>[],
    ): Promise<DecoratedItem<T>[]> => {
      if (items.length === 0) return [];

      const permissions = await getAuthzRows(items.map((i) => i.id));
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

      return Object.values(decoratedItems).map((item) => ({
        ...item,
        viewerOperations: Array.from(item.viewerOperations ?? []),
      }));
    };

    return {
      addAuthzToItems,
      listGrantedAuthorizationsForOwnedMediaItem,
    };
  };
};
