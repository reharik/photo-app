import { AlbumMemberRole, ViewerOperation } from '@packages/contracts';
import type { Knex } from 'knex';
import { AuthorizationReadRepository } from '../../../repositories/readRepositories/authorizationReadRepository';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { AuthorizationProjection } from './viewerAlbumAuthzReadService';
import { AlbumItemProjection, DecoratedAlbumItemProjection } from './viewerAlbumReadService.types';
import { MediaItemProjection, ViewableItemProjection } from './viewerMediaItemReadService.types';

export type MediaItemPermissionResult = {
  mediaItemId: string;
  viewerOperations: string[];
};

export type ViewerMediaItemAuthzService = {
  addAuthzToItem: (
    item: MediaItemProjection,
  ) => Promise<MediaItemProjection & { viewerOperations: string[] }>;
  addAuthzToItems: (
    items: MediaItemProjection[],
  ) => Promise<(MediaItemProjection & { viewerOperations: string[] })[]>;
  addAuthzToAlbumItemAndMedia: (
    albumItems: AlbumItemProjection[],
    albumViewerMemberRole?: string,
  ) => Promise<DecoratedAlbumItemProjection[]>;
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
    const addAuthzToItem = async (
      item: MediaItemProjection,
    ): Promise<MediaItemProjection & ViewableItemProjection> => {
      const result = await addAuthzToItems([item]);
      return result[0] ?? item;
    };
    const addAuthzToItems = async (
      items: MediaItemProjection[],
    ): Promise<(MediaItemProjection & ViewableItemProjection)[]> => {
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
      const decoratedItems = permissions.reduce<
        Record<string, MediaItemProjection & ViewableItemProjection>
      >(
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
        {} as Record<string, MediaItemProjection & ViewableItemProjection>,
      );

      return Object.values(decoratedItems).map((item) => ({
        ...item,
        viewerOperations: Array.from(item.viewerOperations ?? []),
      }));
    };

    const addAuthzToAlbumItemAndMedia = async (
      albumItems: AlbumItemProjection[],
      albumViewerMemberRole?: string,
    ): Promise<DecoratedAlbumItemProjection[]> => {
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
