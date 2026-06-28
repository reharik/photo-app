import { notEmpty } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  SystemAlbumRepository,
  SystemAuthorizationRepository,
  SystemPendingNotificationRepository,
  SystemUserRepository,
} from '@packages/media-core';
import { NotificationPayload, NotificationService } from '@packages/notifications';
import { Config } from '../../config';
import { WorkerTaskOutcome } from '../../types';

export type NotificationBatcher = () => Promise<'idle' | 'processed'>;

type NotificationBatcherDeps = {
  logger: Logger;
  notificationService: NotificationService;
  systemPendingNotificationRepository: SystemPendingNotificationRepository;
  systemUserRepository: SystemUserRepository;
  systemAlbumRepository: SystemAlbumRepository;
  systemAuthorizationRepository: SystemAuthorizationRepository;
  config: Config;
};

const QUIET_WINDOW_MINUTES = 60;

export const build__NotificationBatcher = ({
  logger,
  notificationService,
  systemPendingNotificationRepository,
  systemUserRepository,
  systemAlbumRepository,
  systemAuthorizationRepository,
  config,
}: NotificationBatcherDeps): NotificationBatcher => {
  return async (): Promise<WorkerTaskOutcome> => {
    const rows =
      await systemPendingNotificationRepository.claimNotificationBatch(QUIET_WINDOW_MINUTES);
    if (!rows.length) {
      return 'idle';
    }
    const recipientMap = groupByMapping(rows, (x) => x.recipientId);
    const albumMap = groupByMapping(rows, (x) => x.aggregateId);

    const userIds = [...recipientMap.keys()];
    const albumIds = [...albumMap.keys()];

    const recipients = await systemUserRepository.getUsersEmail(userIds);
    const recipientEmailMap = indexBy(recipients);

    const albumTitles = await systemAlbumRepository.getAlbumTitlesById(albumIds);
    const albumTitleMap = indexBy(albumTitles);

    const albumAuths = await systemAuthorizationRepository.getAuthorizationsByAlbumId(albumIds);
    const authMap = groupByMapping(albumAuths, (x) => x.grantedToUser);

    const emailPayloads: (NotificationPayload<'albumActivity'> & { id: string })[] = [];
    for (const [recipientId, authRows] of authMap) {
      const recipientEmail = recipientEmailMap.get(recipientId);
      if (!recipientEmail) {
        logger.warn(`User with id: ${recipientId} does not have an email address`);
        continue;
      } // or collect to a dead-letter / log
      const albumTitles = authRows.map((x) => albumTitleMap.get(x.albumId)?.title).filter(notEmpty);
      if (!albumTitles.length) {
        continue;
      }
      emailPayloads.push({
        to: recipientEmail.emailAddress,
        template: 'albumActivity',
        data: { albumTitles, viewUrl: config.clientUrl },
        channels: ['email'],
        id: recipientId,
      });
    }
    const results = await Promise.allSettled(
      emailPayloads.map((x) => notificationService.notify(x)),
    );

    // rows to delete: sent recipients' rows + rows that were orphaned (revoked/no-access/deleted-album)
    // rows to keep: failed-send recipients' rows
    const failedRecipientIds = emailPayloads
      .filter((_, i) => results[i].status === 'rejected')
      .map((p) => p.id);
    const allFailedRows = failedRecipientIds.flatMap((x) => recipientMap.get(x)).filter(notEmpty);
    const bumpRowsIds = allFailedRows.filter((x) => x.attempts < 4).map((x) => x.id);
    const deleteFailedRowIds = allFailedRows.filter((x) => x.attempts === 4).map((x) => x.id);
    const deleteSuccessfulRowIds = rows
      .filter((row) => !failedRecipientIds.includes(row.recipientId))
      .map((x) => x.id);
    const deleteIds = [...deleteSuccessfulRowIds, ...deleteFailedRowIds];
    await systemPendingNotificationRepository.deleteCompletedRecords(deleteIds);
    await systemPendingNotificationRepository.bumpRecordAttemptsByIds(bumpRowsIds);

    return deleteIds.length ? 'processed' : 'idle';
  };
};
