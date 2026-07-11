import { PendingNotificationKind } from '@packages/contracts';
import { PendingNotification, SystemAlbumRepository, UserContact } from '@packages/media-core';
import { Config } from '../../../../config';
import { FastSweepNotificationStrategy, PayloadResult } from './types';

type MediaItemsSharedStrategyDeps = {
  systemAlbumRepository: SystemAlbumRepository;
  config: Config;
};

export const build__MediaItemsSharedStrategy = ({
  config,
}: MediaItemsSharedStrategyDeps): FastSweepNotificationStrategy<'itemShareInvite'> => ({
  kind: PendingNotificationKind.itemShared,
  execute: async (
    rows: PendingNotification[],
    userMap: Map<string, UserContact>,
  ): Promise<PayloadResult<'itemShareInvite'>[]> => {
    return rows.map((row) => {
      const recipientEmail = userMap.get(row.recipientId)?.email;
      if (!recipientEmail) {
        return { row, kind: 'skipped', reason: 'no recipient email' };
      }
      const actor = userMap.get(row.actorId);
      return {
        row,
        kind: 'ready',
        payload: {
          to: recipientEmail,
          template: 'itemShareInvite',
          channels: ['email'],
          data: {
            inviterName: actor ? `${actor.firstName} ${actor.lastName}` : '',
            inviteUrl: `${config.clientUrl}/shared/items`,
            resourceName: '',
          },
        },
      };
    });
  },
});
