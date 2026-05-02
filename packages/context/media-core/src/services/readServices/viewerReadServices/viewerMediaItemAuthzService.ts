import { AlbumMemberRole, ViewerOperation } from '@packages/contracts';
import type { Knex } from 'knex';
import { AuthorizationReadRepository } from '../../../repositories/readRepositories/authorizationReadRepository';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { AuthzDecoratedItemProjection } from './viewerMediaItemReadService.types';
import { AuthorizationProjection } from './viewerSharedWithMeMediaItemReadService';

export type MediaItemPermissionResult = {
  mediaItemId: string;
  viewerOperations: string[];
};

export type ViewerMediaItemAuthzService = {
  addAuthzToItem: <T>(item: UnDecoratedMediaItem<T>) => Promise<DecoratedMediaItem<T>>;
  addAuthzToItems: <T>(items: UnDecoratedMediaItem<T>[]) => Promise<DecoratedMediaItem<T>[]>;
  addAuthzToAlbumItemAndMedia: <T, U>(
    albumItems: UnDecoratedAlbumItem<T, U>[],
    albumViewerMemberRole?: string,
  ) => Promise<DecoratedAlbumItem<T, U>[]>;
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
  albumRole: string | null;
  // future: locked: boolean;
  // future: allowReshare: boolean;
  // future: albumItemAllowReshare: boolean | null;
};

type UnDecoratedAlbumItem<T, U> = T & {
  id: EntityId;
  mediaItem: UnDecoratedMediaItem<U>;
};

type DecoratedAlbumItem<T, U> = T & {
  id: EntityId;
  viewerIsOwner: boolean;
  viewerOperations: string[];
  mediaItem: DecoratedMediaItem<U>;
};

type UnDecoratedMediaItem<T> = T & {
  id: EntityId;
  ownerId: EntityId;
};

type DecoratedMediaItem<T> = T & {
  id: EntityId;
  ownerId: EntityId;
  viewerIsOwner: boolean;
  viewerOperations: string[];
};

export const buildViewerMediaItemAuthzServiceFactory = ({
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
        permission: row.permission.value,
        label: row.description,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      }));
    };
    const getAuthzRows = async (mediaItemIds: EntityId[]): Promise<MediaItemPermissionRow[]> => {
      return database<MediaItemPermissionRow>('media_item as mi')
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
        );
    };
    const addAuthzToItem = async <T>(
      item: UnDecoratedMediaItem<T>,
    ): Promise<DecoratedMediaItem<T>> => {
      const result = await addAuthzToItems([item]);
      return result[0] ?? item;
    };
    const addAuthzToItems = async <T>(
      items: UnDecoratedMediaItem<T>[],
    ): Promise<DecoratedMediaItem<T>[]> => {
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
      const decoratedItems = permissions.reduce<Record<string, T & AuthzDecoratedItemProjection>>(
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
            ViewerOperation.items().forEach((op) => addItem(op.value, mediaItem.viewerOperations));
          } else if (row.albumRole) {
            const role = AlbumMemberRole.fromValue(row.albumRole);
            role.operations.forEach((op) => addItem(op.value, mediaItem.viewerOperations));
          }
          mediaItem.viewerIsOwner = row.ownerId === viewerId;
          // assign or reassign the media item back to the acc
          acc[row.mediaItemId] = mediaItem;
          return acc;
        },
        {} as Record<string, T & AuthzDecoratedItemProjection>,
      );

      return Object.values(decoratedItems).map((item) => ({
        ...item,
        viewerOperations: Array.from(item.viewerOperations ?? []),
      }));
    };

    const addAuthzToAlbumItemAndMedia = async <T, U>(
      albumItems: UnDecoratedAlbumItem<T, U>[],
      albumViewerMemberRole?: string,
    ): Promise<DecoratedAlbumItem<T, U>[]> => {
      if (albumItems.length === 0) return [];

      let albumItemOperations: string[] = [];
      if (albumViewerMemberRole) {
        const role = AlbumMemberRole.fromValue(albumViewerMemberRole);
        if (role) {
          albumItemOperations = role.operations.map((op) => op.value);
        }
      }
      const mediaItems = await addAuthzToItems(albumItems.map((i) => i.mediaItem));
      const decoratedAlbumItems = albumItems.map((i) => {
        const mi = mediaItems.find((m) => m.id === i.mediaItem.id);
        const mediaItem = mi ?? {
          ...i.mediaItem,
          viewerOperations: albumItemOperations,
          viewerIsOwner: false,
        };
        return {
          ...i,
          mediaItem,
          viewerOperations: albumItemOperations,
          viewerIsOwner: mediaItem.viewerIsOwner,
        };
      });
      return decoratedAlbumItems;
    };

    return {
      addAuthzToItems,
      addAuthzToItem,
      listGrantedAuthorizationsForOwnedMediaItem,
      addAuthzToAlbumItemAndMedia,
    };
  };
};
