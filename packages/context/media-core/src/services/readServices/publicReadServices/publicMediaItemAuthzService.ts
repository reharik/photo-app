import { AlbumMemberRole, ViewerOperation } from '@packages/contracts';
import type { Knex } from 'knex';
import { EntityId } from '../../../types';
import { DecoratedItem, HasId, UnDecoratedItem } from '../types';

export type PublicMediaItemPermissionResult = {
  mediaItemId: string;
  viewerOperations: ViewerOperation[];
};

export type PublicMediaItemAuthzService = {
  addPublicAuthzToItems: <T extends HasId>(
    publicLinkId: string,
    items: UnDecoratedItem<T>[],
  ) => Promise<DecoratedItem<T>[]>;
};

type PublicMediaItemPermissionRow = {
  mediaItemId: EntityId;
  ownerId: EntityId;
  albumRole?: AlbumMemberRole;
  permissions: string;
  // future: locked: boolean;
  // future: allowReshare: boolean;
  // future: albumItemAllowReshare: boolean | null;
};

export const build__PublicMediaItemAuthzService = ({
  database,
}: {
  database: Knex;
}): PublicMediaItemAuthzService => {
  const addPublicAuthzToItems = async <T extends HasId>(
    publicLinkId: string,
    items: UnDecoratedItem<T>[],
  ): Promise<DecoratedItem<T>[]> => {
    if (items.length === 0) return [];

    const ids = items.map((i) => i.id);

    const permissions = await database<PublicMediaItemPermissionRow>('access_grant as ag')
      .leftJoin('share_link as sl', 'sl.id', 'ag.share_link_id')
      .leftJoin('grant as g', 'g.access_grant_id', 'ag.id')
      .where('sl.id', publicLinkId)
      .whereIn('g.media_item_id', ids)
      .select<
        PublicMediaItemPermissionRow[]
      >('g.media_item_id as mediaItemId', 'g.permissions as permissions');

    const permissionMap = new Map(
      permissions.map((p) => [
        p.mediaItemId,
        p.permissions
          ? p.permissions
              .split(',')
              .filter(Boolean)
              .map((op) => ViewerOperation.fromValue(op))
          : [],
      ]),
    );

    return items.map((item) => ({
      ...item,
      viewerIsOwner: false,
      viewerOperations: permissionMap.get(item.id) ?? [],
    })) as DecoratedItem<T>[];
  };
  return {
    addPublicAuthzToItems,
  };
};
