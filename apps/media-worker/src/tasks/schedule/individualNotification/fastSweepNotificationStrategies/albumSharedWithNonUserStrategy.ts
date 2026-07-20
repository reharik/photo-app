import { AsyncNotificationKind } from '@packages/contracts';
import { indexBy } from '@packages/infrastructure';
import {
  AsyncNotification,
  SystemAlbumRepository,
  SystemAuthorizationRepository,
  UserContact,
} from '@packages/media-core';
import { Config } from '../../../../config';
import { FastSweepNotificationStrategy, PayloadResult } from './types';

type AlbumSharedWithNonUserStrategyDeps = {
  systemAlbumRepository: SystemAlbumRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  config: Config;
};

export const build__AlbumSharedWithNonUserStrategy = ({
  config,
  systemAlbumRepository,
  systemAuthorizationRepository,
}: AlbumSharedWithNonUserStrategyDeps): FastSweepNotificationStrategy<'albumGuestInvite'> => ({
  kind: AsyncNotificationKind.guestAlbumShared,
  execute: async (
    rows: AsyncNotification[],
    userMap: Map<string, UserContact>,
  ): Promise<PayloadResult<'albumGuestInvite'>[]> => {
    const albumIds = [...new Set(rows.map((x) => x.targetId))];
    const albums = await systemAlbumRepository.getAlbumTitlesById(albumIds);
    const albumMap = indexBy(albums);

    const results: PayloadResult<'albumGuestInvite'>[] = [];
    for (const row of rows) {
      const recipientEmail = userMap.get(row.recipientId)?.email;
      const publicLinkAuthorization =
        await systemAuthorizationRepository.getPublicLinkAuthorizationById(row.sourceId);
      const token = publicLinkAuthorization.linkToken;
      if (!recipientEmail || !token) {
        results.push({ row, kind: 'skipped', reason: 'no recipient email or token' });
        continue;
      }
      const actor = userMap.get(row.actorId);
      const album = albumMap.get(row.targetId);
      results.push({
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
      });
    }
    return results;
  },
});
