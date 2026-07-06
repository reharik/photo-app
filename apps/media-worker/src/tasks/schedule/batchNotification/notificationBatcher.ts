import { notEmpty } from '@packages/contracts';
import { groupByMapping, indexBy, Logger } from '@packages/infrastructure';
import {
  SystemAlbumRepository,
  SystemAuthorizationRepository,
  SystemPendingNotificationRepository,
  SystemUserRepository,
} from '@packages/media-core';
import { NotificationPayload, NotificationService } from '@packages/notifications';
import { Config } from '../../../config';
import { WorkerTaskOutcome } from '../../../types';
import { cleanUp, RowOutcome, summarizeOutcomes } from '../outcomeCleanup';

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
    const rows = await systemPendingNotificationRepository.claimNotificationBatch(
      config.debounceEmailWindowSeconds,
    );
    logger.info(`[notificationBatcher] claimed ${rows.length} row(s)`);
    if (!rows.length) {
      return 'idle';
    }
    const bad = rows.filter((r) => !notEmpty(r.recipientId));
    if (bad.length) {
      logger.error(`[batcher] claimed ${bad.length} null-recipient row(s) — cadence filter leak`);
    }
    const recipientMap = groupByMapping(
      rows.filter((r) => notEmpty(r.recipientId)),
      (x) => x.recipientId,
    );
    const albumMap = groupByMapping(rows, (x) => x.aggregateId);

    const userIds = [...recipientMap.keys()].filter(notEmpty);
    const albumIds = [...albumMap.keys()];
    const recipients = await systemUserRepository.getUserContacts(userIds);
    const albumTitles = await systemAlbumRepository.getAlbumTitlesById(albumIds);
    const albumAuths = await systemAuthorizationRepository.getAuthorizationsByAlbumId(albumIds);

    const recipientEmailMap = indexBy(recipients);
    const albumTitleMap = indexBy(albumTitles);
    const authMap = groupByMapping(albumAuths, (x) => x.grantedToUser);

    const outcomes: RowOutcome[] = [];
    for (const [recipientId, rowsForRecipient] of recipientMap) {
      // drive off claimed rows
      const authRows = authMap.get(recipientId!) ?? [];
      const recipientEmail = recipientEmailMap.get(recipientId!);
      if (!recipientEmail) {
        logger.warn(`User ${recipientId} has no email`);
        for (const row of rowsForRecipient) outcomes.push({ row, result: 'skipped' });
        continue;
      }

      const emailsAlbumTitles = authRows
        .map((x) => albumTitleMap.get(x.albumId)?.title)
        .filter(notEmpty);
      if (!emailsAlbumTitles.length) {
        for (const row of rowsForRecipient) outcomes.push({ row, result: 'skipped' });
        continue;
      }
      const payload: NotificationPayload<'albumActivity'> = {
        to: recipientEmail.email,
        template: 'albumActivity',
        data: { albumTitles: emailsAlbumTitles, viewUrl: config.clientUrl },
        channels: ['email'],
      };

      const r = await notificationService.notify(payload);
      const result = r.success ? 'sent' : 'failed';

      for (const row of rowsForRecipient) outcomes.push({ row, result }); // one send → fan its fate across all its rows
    }
    logger.info('[notificationBatcher] send loop complete', summarizeOutcomes(outcomes));

    const { deleteIds, bumpRowIds, logs } = cleanUp(outcomes);
    await systemPendingNotificationRepository.deleteCompletedRecords(deleteIds);
    await systemPendingNotificationRepository.bumpRecordAttemptsByIds(bumpRowIds);
    logs.forEach((x) => logger.info(x));
    return deleteIds.length + bumpRowIds.length > 0 ? 'processed' : 'idle';
  };
};
