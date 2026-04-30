import { AlbumMemberRole, ViewerOperation } from '@packages/contracts';
import type { Knex } from 'knex';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';

export type MediaItemPermissionResult = {
  mediaItemId: string;
  operations: string[];
};

export type ViewerMediaItemPermissionService = {
  getPermissionsForViewer: (mediaItemIds: EntityId[]) => Promise<MediaItemPermissionResult[]>;
  canDownload: (mediaItemId: EntityId) => Promise<boolean>;
};

export interface ViewerMediaItemPermissionServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ViewerMediaItemPermissionService;
}

type MediaItemPermissionRow = {
  mediaItemId: EntityId;
  ownerId: EntityId;
  albumRole: string | null;
  // future: locked: boolean;
  // future: allowReshare: boolean;
  // future: albumItemAllowReshare: boolean | null;
};

export const buildViewerMediaItemPermissionServiceFactory = ({
  database,
}: {
  database: Knex;
}): ViewerMediaItemPermissionServiceFactory => {
  return ({ viewerId }: { viewerId: string }): ViewerMediaItemPermissionService => {
    const getPermissionsForViewer = async (
      mediaItemIds: EntityId[],
    ): Promise<MediaItemPermissionResult[]> => {
      if (mediaItemIds.length === 0) return [];

      const rows = await database<MediaItemPermissionRow>('media_item as mi')
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

      const permissionMap = rows.reduce<Map<string, Set<string>>>((acc, row) => {
        const existing = acc.get(row.mediaItemId) ?? new Set<string>();

        if (row.ownerId === viewerId) {
          ViewerOperation.items().forEach((op) => existing.add(op.value));
        } else if (row.albumRole) {
          const role = AlbumMemberRole.fromValue(row.albumRole);
          role.operations.forEach((op) => existing.add(op.value));
        }

        acc.set(row.mediaItemId, existing);
        return acc;
      }, new Map<string, Set<string>>());

      return mediaItemIds.map((id) => ({
        mediaItemId: id,
        operations: Array.from(permissionMap.get(id) ?? []),
      }));
    };

    const canDownload = async (mediaItemId: string): Promise<boolean> => {
      const [result] = await getPermissionsForViewer([mediaItemId]);
      return result?.operations.includes(ViewerOperation.download.value) ?? false;
    };

    return {
      getPermissionsForViewer,
      canDownload,
    };
  };
};
