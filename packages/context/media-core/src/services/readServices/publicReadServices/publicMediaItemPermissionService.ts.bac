import { ViewerOperation } from '@packages/contracts';
import type { Knex } from 'knex';
import { EntityId } from '../../../types/types';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import { MediaItemPermissionResult } from '../viewerReadServices/viewerMediaItemAuthzService';

export type PublicMediaItemPermissionService = {
  getPermissionsForPublicLink: (mediaItemIds: EntityId[]) => Promise<MediaItemPermissionResult[]>;
  canDownload: (mediaItemId: EntityId) => Promise<boolean>;
};

export interface PublicMediaItemPermissionServiceFactory extends ReadServiceFactoryBase {
  (args: { publicLinkId: string }): PublicMediaItemPermissionService;
}

type MediaItemPermissionRow = {
  mediaItemId: EntityId;
  permission: string;
  // future: locked: boolean;
  // future: allowReshare: boolean;
  // future: albumItemAllowReshare: boolean | null;
};

export const build__PublicMediaItemPermissionServiceFactory = ({
  database,
}: {
  database: Knex;
}): PublicMediaItemPermissionServiceFactory => {
  return ({ publicLinkId }: { publicLinkId: string }): PublicMediaItemPermissionService => {
    const getPermissionsForPublicLink = async (
      mediaItemIds: EntityId[],
    ): Promise<MediaItemPermissionResult[]> => {
      if (mediaItemIds.length === 0) return [];

      const rows = await database<MediaItemPermissionRow>('access_grant as ag')
        .leftJoin('share_link as sl', 'sl.id', 'ag.share_link_id')
        .leftJoin('grant as g', 'g.access_grant_id', 'ag.id')
        .where('sl.id', publicLinkId)
        .whereIn('g.media_item_id', mediaItemIds)
        .select<
          MediaItemPermissionRow[]
        >('g.media_item_id as mediaItemId', 'g.permission as permission');

      return rows.map((r) => ({
        mediaItemId: r.mediaItemId,
        operations: r.permission.split(','),
      }));
    };

    const canDownload = async (mediaItemId: string): Promise<boolean> => {
      const [result] = await getPermissionsForPublicLink([mediaItemId]);
      return result?.operations.includes(ViewerOperation.download.value) ?? false;
    };

    return {
      getPermissionsForPublicLink,
      canDownload,
    };
  };
};
