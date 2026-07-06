import { PendingNotification } from '@packages/media-core';

export type RowOutcome = { row: PendingNotification; result: 'sent' | 'failed' | 'skipped' };

// Roll a batch of per-row outcomes into counts for a single summary log line, so a sweep's
// result is legible without reading every per-row line.
export const summarizeOutcomes = (
  outcomes: RowOutcome[],
): { total: number; sent: number; failed: number; skipped: number } => ({
  total: outcomes.length,
  sent: outcomes.filter((x) => x.result === 'sent').length,
  failed: outcomes.filter((x) => x.result === 'failed').length,
  skipped: outcomes.filter((x) => x.result === 'skipped').length,
});

export const cleanUp = (outcomes: RowOutcome[]) => {
  // rows to delete: sent recipients' rows + rows that were orphaned (revoked/no-access/deleted-album)
  // rows to keep: failed-send recipients' rows
  const failedRecipientRows = outcomes.filter((x) => x.result === 'failed').map((x) => x.row);
  const bumpRowIds = failedRecipientRows.filter((x) => x.attempts < 4).map((x) => x.id);
  const deleteFailedRowIds = failedRecipientRows.filter((x) => x.attempts >= 4).map((x) => x.id);
  const deleteSkippedRowIds = outcomes.filter((x) => x.result === 'skipped').map((x) => x.row.id);
  const deleteSuccessfulRowIds = outcomes.filter((x) => x.result === 'sent').map((x) => x.row.id);

  const bumpLogs = bumpRowIds.map(
    (x) => `[pending_notification_row] row ${x} -> failed to send, bumping attempts`,
  );
  const killLogs = deleteFailedRowIds.map(
    (x) => `[pending_notification_row] row ${x} -> failed to send, too many attempts`,
  );
  const skippedLogs = deleteSkippedRowIds.map(
    (x) =>
      `[pending_notification_row] row ${x} -> failed to send, either no active albums or no recipient email address`,
  );
  const okLogs = deleteSuccessfulRowIds.map(
    (x) => `[pending_notification_row] row ${x} -> successfully sent`,
  );

  const deleteIds = [...deleteSuccessfulRowIds, ...deleteFailedRowIds, ...deleteSkippedRowIds];
  return { deleteIds, bumpRowIds, logs: [...bumpLogs, ...killLogs, ...skippedLogs, ...okLogs] };
};
