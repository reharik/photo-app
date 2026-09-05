import { AsyncNotificationKind, EmailKind } from '@packages/contracts';
import { indexBy, Logger } from '@packages/infrastructure';
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
  logger: Logger;
};

export const build__AlbumSharedWithNonUserStrategy = ({
  config,
  systemAlbumRepository,
  systemAuthorizationRepository,
  logger,
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
      if (!pendingUserAuthorization) {
        logger.warn('skipping notification: authorization no longer exists', {
          notificationId: row.id,
          subjectId: row.subjectId,
          kind: row.kind.value,
        });
        results.push({
          row,
          kind: 'skipped',
          reason: `authorization no longer exists, notificationId: ${row.id}, subjectId: ${row.subjectId}, kind: ${row.kind.value}`,
        });
        continue;
      }
      const token = pendingUserAuthorization.linkToken;
      if (!recipientEmail) {
        results.push({ row, kind: 'skipped', reason: 'no user row / email for recipient_id' });
        continue;
      }
      if (!token) {
        results.push({ row, kind: 'skipped', reason: 'authorization has no link_token' });
        continue;
      }
      // Pre-migration rows have no accessGrantId; for this kind subjectId IS the grant,
      // so they stay attributable without a backfill. Logged because the fallback would
      // otherwise mask an upstream stamping bug forever — the queue turns over in
      // minutes, so this should stop firing once the pre-migration backlog drains. If
      // it is still firing, something on the enqueue side is not populating the column.
      if (!row.accessGrantId) {
        logger.debug(
          '[albumSharedWithNonUser] row has no accessGrantId — deriving from subjectId',
          {
            notificationId: row.id,
            subjectId: row.subjectId,
            derivedAccessGrantId: pendingUserAuthorization.id,
          },
        );
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
        emailKind: EmailKind.guestAlbumShared,
        recipientEmail,
        accessGrantId: row.accessGrantId ?? pendingUserAuthorization.id, // see the debug log above
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
