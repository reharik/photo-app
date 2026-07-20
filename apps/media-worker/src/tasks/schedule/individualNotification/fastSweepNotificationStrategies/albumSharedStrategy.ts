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
}: AlbumSharedStrategyDeps): FastSweepNotificationStrategy<'albumShareInvite'> => ({
  kind: AsyncNotificationKind.albumShared,
  execute: async (
    rows: AsyncNotification[],
    userMap: Map<string, UserContact>,
  ): Promise<PayloadResult<'albumShareInvite'>[]> => {
    const albumIds = [...new Set(rows.map((x) => x.targetId))];
    const albums = await systemAlbumRepository.getAlbumTitlesById(albumIds);
    const albumMap = indexBy(albums);
    return rows.map((row) => {
      const recipientEmail = userMap.get(row.recipientId)?.email;
      if (!recipientEmail) {
        return { row, kind: 'skipped', reason: 'no recipient email' };
      }
      const actor = userMap.get(row.actorId);
      const album = albumMap.get(row.targetId);
      return {
        row,
        kind: 'ready',
        payload: {
          to: recipientEmail,
          template: 'albumShareInvite',
          channels: ['email'],
          data: {
            inviterName: actor ? `${actor.firstName} ${actor.lastName}` : '',
            resourceName: album?.title ?? '',
            inviteUrl: `${config.clientUrl}/albums/${album?.id}`,
          },
        },
      };
    });
  },
});
