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
}: AlbumSharedWithNonUserStrategyDeps): FastSweepNotificationStrategy<'guestAlbumShared'> => ({
  kind: AsyncNotificationKind.guestAlbumShared,
  execute: async (
    rows: AsyncNotification[],
    userMap: Map<string, UserContact>,
  ): Promise<PayloadResult<'guestAlbumShared'>[]> => {
    const albumIds = [...new Set(rows.map((x) => x.containerId))];
    const albums = await systemAlbumRepository.getAlbumTitlesById(albumIds);
    const albumMap = indexBy(albums);
    const results: PayloadResult<'guestAlbumShared'>[] = [];
    for (const row of rows) {
      const recipientEmail = userMap.get(row.recipientId)?.email;
      const pendingUserAuthorization =
        await systemAuthorizationRepository.getPendingUserAuthorizationById(row.subjectId);
      const token = pendingUserAuthorization.linkToken;
      if (!recipientEmail) {
        results.push({ row, kind: 'skipped', reason: 'no user row / email for recipient_id' });
        continue;
      }
      if (!token) {
        results.push({ row, kind: 'skipped', reason: 'authorization has no link_token' });
        continue;
      }
      const actor = userMap.get(row.actorId);
      const album = albumMap.get(row.containerId);
      // An empty share is an upstream bug, not an email — don't send, just record it.
      // Album-missing and album-empty are distinct failures; keep them distinguishable.
      if (!album) {
        results.push({ row, kind: 'skipped', reason: 'album row not found for container_id' });
        continue;
      }
      if ((album.itemCount ?? 0) === 0) {
        results.push({ row, kind: 'skipped', reason: 'album is empty (itemCount 0)' });
        continue;
      }
      results.push({
        row,
        kind: 'ready',
        payload: {
          to: recipientEmail,
          template: 'guestAlbumShared',
          channels: ['email'],
          data: {
            inviterName: actor ? `${actor.firstName} ${actor.lastName}` : '',
            resourceName: album?.title ?? '',
            inviteUrl: `${config.clientUrl}/shared/${token}`,
            // Carry the banked email (prefills the field, still editable) and a returnTo
            // pointing at the album's authenticated detail route (row.containerId is the
            // albumId) so a guest lands back on it after signup. Both are percent-encoded;
            // the FE validates returnTo (safeReturnTo) and gates album visibility before
            // navigating.
            signupUrl: `${config.clientUrl}/signup?email=${encodeURIComponent(
              recipientEmail,
            )}&returnTo=${encodeURIComponent(`/albums/${row.containerId}`)}`,
            inviterEmail: actor?.email ?? '',
            itemCount: album?.itemCount ?? 0,
          },
        },
      });
    }
    return results;
  },
});
