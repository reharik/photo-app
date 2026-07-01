import { notEmpty } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  SystemAlbumRepository,
  SystemAuthorizationRepository,
  SystemPendingNotificationRepository,
  SystemUserRepository,
  templateForKind,
} from '@packages/media-core';
import { NotificationPayload, NotificationService } from '@packages/notifications';
import { Config } from '../../../config';
import { WorkerTaskOutcome } from '../../../types';
import { cleanUp, RowOutcome, summarizeOutcomes } from '../outcomeCleanup';

export type FastSweepNotification = () => Promise<'idle' | 'processed'>;

type FastSweepNotificationDeps = {
  logger: Logger;
  notificationService: NotificationService;
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  systemUserRepository: SystemUserRepository;
  systemAlbumRepository: SystemAlbumRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  config: Config;
};

export const build__FastSweepNotification = ({
  logger,
  notificationService,
  systemPendingNotificationRepository,
  systemUserRepository,
  systemAlbumRepository,
  config,
}: FastSweepNotificationDeps): FastSweepNotification => {
  const QUIET_WINDOW_MINUTES = config.isProduction ? 60 : 5;

  return async (): Promise<WorkerTaskOutcome> => {
    const rows =
      await systemPendingNotificationRepository.claimIndividualNotifications(QUIET_WINDOW_MINUTES);
    logger.info(`[notification-send] claimed ${rows.length} row(s)`);
    if (!rows.length) {
      return 'idle';
    }
    const recipientMap = groupByMapping(rows, (x) => x.recipientId);
    // break this out into functions starting here when next fastSweep shape comes
    const albumMap = groupByMapping(rows, (x) => x.aggregateId);

    const userIds = [...recipientMap.keys()];
    const albumIds = [...albumMap.keys()];
    const actorIds = new Set(rows.map((x) => x.actorId).filter(notEmpty));

    const users = await systemUserRepository.getUserContacts([...userIds, ...actorIds]);
    const albumTitles = await systemAlbumRepository.getAlbumTitlesById(albumIds);

    const userMap = indexBy(users);
    const albumTitleMap = indexBy(albumTitles);

    const outcomes: RowOutcome[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Registry-driven template selection by kind. Only kinds routed to the
      // shareInvite template have a wired send path here; itemShared
      // (template: null) and any future immediate kind are skipped until their
      // copy exists — do not send the album-specific shareInvite for them.
      const template = templateForKind(row.kind);
      if (template !== 'shareInvite') {
        outcomes.push({ row, result: 'skipped' });
        logger.warn(
          `[notification-send] no immediate send path for kind '${row.kind}' (template=${template})`,
        );
        continue;
      }

      const recipientEmail = userMap.get(row.recipientId)?.email;
      if (!recipientEmail) {
        outcomes.push({ row, result: 'skipped' });
        logger.warn(`User with id: ${row.recipientId} does not have an email address`);
        continue;
      }

      const inviter = userMap.get(row.actorId);
      const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : '';
      const album = albumTitleMap.get(row.aggregateId);
      const inviteUrl = `${config.clientUrl}/album/${album?.id}`;

      const payload: NotificationPayload<'shareInvite'> = {
        to: recipientEmail,
        template: 'shareInvite',
        data: { inviterName, resourceName: album?.title ?? '', inviteUrl },
        channels: ['email'],
      };
      const r = await notificationService.notify(payload);
      outcomes.push({ row, result: r.success ? 'sent' : 'failed' });
    }

    // end function break out

    logger.info('[notification-send] send loop complete', summarizeOutcomes(outcomes));

    const { deleteIds, bumpRowIds, logs } = cleanUp(outcomes);
    await systemPendingNotificationRepository.deleteCompletedRecords(deleteIds);
    await systemPendingNotificationRepository.bumpRecordAttemptsByIds(bumpRowIds);
    logs.forEach((x) => logger.info(x));
    return deleteIds.length + bumpRowIds.length > 0 ? 'processed' : 'idle';
  };
};
