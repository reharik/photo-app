import { ViewerMediaItemPermissionService } from '@packages/media-core';

export const mediaItemPermissionsForViewer = async (
  permissionService: ViewerMediaItemPermissionService,
  mediaItemIds: () => string[],
) => {
  const permissions = await permissionService.getPermissionsForViewer(mediaItemIds());

  const permissionMap = new Map(
    permissions.map((p) => [p.mediaItemId, p.operations.map((o) => o.value)]),
  );

  return permissionMap;
};
