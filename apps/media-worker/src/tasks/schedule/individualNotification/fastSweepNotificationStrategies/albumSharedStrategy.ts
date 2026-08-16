import { AsyncNotificationKind } from '@packages/contracts';
import { indexBy } from '@packages/infrastructure';
import { AsyncNotification, SystemAlbumRepository, UserContact } from '@packages/media-core';
import { Config } from '../../../../config';
import { FastSweepNotificationStrategy, PayloadResult } from './types';

type AlbumSharedStrategyDeps = {
  systemAlbumRepository: SystemAlbumRepository;
  config: Config;
};

export const build__AlbumSharedStrategy = ({
  config,
  systemAlbumRepository,
}: AlbumSharedStrategyDeps): FastSweepNotificationStrategy<'memberAlbumShared'> => ({
  kind: AsyncNotificationKind.albumShared,
  execute: async (
    rows: AsyncNotification[],
    userMap: Map<string, UserContact>,
  ): Promise<PayloadResult<'memberAlbumShared'>[]> => {
    const albumIds = [...new Set(rows.map((x) => x.containerId))];
    const albums = await systemAlbumRepository.getAlbumTitlesById(albumIds);
    const albumMap = indexBy(albums);
    return rows.map((row) => {
      const recipient = userMap.get(row.recipientId);
      if (!recipient?.email) {
        return { row, kind: 'skipped', reason: 'no user row / email for recipient_id' };
      }
      // if (recipient.userStatus.equals(UserStatus.pending)) {
      //   return { row, kind: 'skipped', reason: 'User is pending' };
      // }
      const actor = userMap.get(row.actorId);
      const album = albumMap.get(row.containerId);
      // An empty share is an upstream bug, not an email — don't send, just record it.
      // Album-missing and album-empty are distinct failures; keep them distinguishable.
      if (!album) {
        return { row, kind: 'skipped', reason: 'album row not found for container_id' };
      }
      if ((album.itemCount ?? 0) === 0) {
        return { row, kind: 'skipped', reason: 'album is empty (itemCount 0)' };
      }
      return {
        row,
        kind: 'ready',
        payload: {
          to: recipient.email,
          template: 'memberAlbumShared',
          channels: ['email'],
          data: {
            inviterName: actor ? `${actor.firstName} ${actor.lastName}` : '',
            resourceName: album?.title ?? '',
            inviteUrl: `${config.clientUrl}/albums/${album?.id}`,
            itemCount: album?.itemCount ?? 0,
          },
        },
      };
    });
  },
});
