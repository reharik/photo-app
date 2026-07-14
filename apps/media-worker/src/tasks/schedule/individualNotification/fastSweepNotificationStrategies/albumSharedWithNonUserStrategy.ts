import { PendingNotificationKind } from '@packages/contracts';
import { indexBy } from '@packages/infrastructure';
import { PendingNotification, SystemAlbumRepository, UserContact } from '@packages/media-core';
import { Config } from '../../../../config';
import { FastSweepNotificationStrategy, PayloadResult } from './types';

type AlbumSharedWithNonUserStrategyDeps = {
  systemAlbumRepository: SystemAlbumRepository;
  config: Config;
};

export const build__AlbumSharedWithNonUserStrategy = ({
  config,
  systemAlbumRepository,
}: AlbumSharedWithNonUserStrategyDeps): FastSweepNotificationStrategy<'albumGuestInvite'> => ({
  kind: PendingNotificationKind.guestAlbumShared,
  execute: async (
    rows: PendingNotification[],
    userMap: Map<string, UserContact>,
  ): Promise<PayloadResult<'albumGuestInvite'>[]> => {
    const albumIds = [...new Set(rows.map((x) => x.aggregateId))];
    const albums = await systemAlbumRepository.getAlbumTitlesById(albumIds);
    const albumMap = indexBy(albums);
    return rows.map((row) => {
      const recipientEmail = userMap.get(row.recipientId)?.email;
      const token = row.data?.token;
      if (!recipientEmail || !token) {
        return { row, kind: 'skipped', reason: 'no recipient email or token' };
      }
      const actor = userMap.get(row.actorId);
      const album = albumMap.get(row.aggregateId);
      return {
        row,
        kind: 'ready',
        payload: {
          to: recipientEmail,
          template: 'albumGuestInvite',
          channels: ['email'],
          data: {
            inviterName: actor ? `${actor.firstName} ${actor.lastName}` : '',
            resourceName: album?.title ?? '',
            inviteUrl: `${config.clientUrl}/shared/${token}`,
            signupUrl: `${config.clientUrl}/signup`,
          },
        },
      };
    });
  },
});
