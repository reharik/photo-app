import { AsyncNotification } from '@packages/media-core';

export type RowOutcome = {
  row: AsyncNotification;
  result: 'sent' | 'failed' | 'skipped';
  reason?: string; // why a row was skipped; carried into the cleanup log
};

export type CleanupLog = { message: string; meta: Record<string, unknown> };

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

const rowMeta = (row: AsyncNotification): Record<string, unknown> => ({
  rowId: row.id,
  kind: row.kind.value,
  recipientId: row.recipientId,
  containerId: row.containerId,
  subjectId: row.subjectId,
  attempts: row.attempts,
});

export const cleanUp = (outcomes: RowOutcome[]) => {
  // rows to delete: sent recipients' rows + rows that were orphaned (revoked/no-access/deleted-album)
  // rows to keep: failed-send recipients' rows
  const failedRecipientRows = outcomes.filter((x) => x.result === 'failed').map((x) => x.row);
  const bumpRows = failedRecipientRows.filter((x) => x.attempts < 4);
  const deleteFailedRows = failedRecipientRows.filter((x) => x.attempts >= 4);
  const skippedOutcomes = outcomes.filter((x) => x.result === 'skipped');
  const sentRows = outcomes.filter((x) => x.result === 'sent').map((x) => x.row);

  const bumpRowIds = bumpRows.map((x) => x.id);

  const bumpLogs: CleanupLog[] = bumpRows.map((x) => ({
    message: '[async_notification] send failed; attempts bumped, row kept for retry',
    meta: rowMeta(x),
  }));
  const killLogs: CleanupLog[] = deleteFailedRows.map((x) => ({
    message: '[async_notification] send failed too many times; row DELETED, no email will be sent',
    meta: rowMeta(x),
  }));
  const skippedLogs: CleanupLog[] = skippedOutcomes.map((x) => ({
    message: '[async_notification] row skipped without sending and DELETED',
    meta: { ...rowMeta(x.row), reason: x.reason ?? 'unspecified' },
  }));
  const okLogs: CleanupLog[] = sentRows.map((x) => ({
    message: '[async_notification] sent successfully; row deleted',
    meta: rowMeta(x),
  }));

  const deleteIds = [
    ...sentRows.map((x) => x.id),
    ...deleteFailedRows.map((x) => x.id),
    ...skippedOutcomes.map((x) => x.row.id),
  ];
  return { deleteIds, bumpRowIds, logs: [...bumpLogs, ...killLogs, ...skippedLogs, ...okLogs] };
};
