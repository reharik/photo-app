import {
  FrontendUploadStatus,
  isInFlightStatus,
  type FrontendUploadStatus as FrontendUploadStatusType,
} from '@packages/contracts';

import type { UploadItem } from '../../application/UploadMediaItemQueue/mediaUploadTypes';

export type UploadProgressCounts = {
  total: number;
  finished: number;
  inFlight: number;
  failed: number;
  processing: number;
  /** Rows the widget stopped watching before the server finished ({@link FrontendUploadStatus.processingDelayed}). */
  delayed: number;
};

export const getUploadProgressCounts = (items: UploadItem[]): UploadProgressCounts => {
  let finished = 0;
  let inFlight = 0;
  let failed = 0;
  let processing = 0;
  let delayed = 0;

  for (const item of items) {
    // processingDelayed counts as finished but not processing: the widget has stopped
    // watching it, so it must not keep the header spinner going.
    if (
      item.status.equals(FrontendUploadStatus.ready) ||
      item.status.equals(FrontendUploadStatus.complete) ||
      item.status.equals(FrontendUploadStatus.processingDelayed)
    ) {
      finished += 1;
    }
    if (item.status.equals(FrontendUploadStatus.complete)) {
      processing += 1;
    }
    if (item.status.equals(FrontendUploadStatus.processingDelayed)) {
      delayed += 1;
    }
    if (isInFlightStatus(item.status)) {
      inFlight += 1;
    }
    if (item.status.equals(FrontendUploadStatus.failed)) {
      failed += 1;
    }
  }

  return { total: items.length, finished, inFlight, failed, processing, delayed };
};

export const getCollapsedSummary = (
  counts: UploadProgressCounts,
  phase: 'active' | 'success',
  sessionHadFailure = false,
): string => {
  if (phase === 'success') {
    return sessionHadFailure ? 'Uploads finished' : 'All uploads complete';
  }

  const { total, finished, inFlight, failed } = counts;

  if (total === 0) {
    return 'Uploads';
  }

  if (inFlight > 0) {
    return `${finished} of ${total}`;
  }

  if (failed > 0) {
    return `${finished} of ${total} · ${failed} failed`;
  }

  return `${finished} of ${total}`;
};

export type UploadPanelPhase = 'idle' | 'active' | 'success';

/** The headline both the panel header and the header pill show. */
export const getPanelSummary = (
  counts: UploadProgressCounts,
  phase: UploadPanelPhase,
  sessionHadFailure: boolean,
): string =>
  phase === 'success'
    ? getCollapsedSummary(counts, 'success', sessionHadFailure)
    : getCollapsedSummary(counts, 'active');

/** Uploading or awaiting server processing: the spinner case, as opposed to done or stuck. */
export const isUploadWorkOngoing = (counts: UploadProgressCounts): boolean =>
  counts.inFlight > 0 || counts.processing > 0;

export const canCancelUpload = (status: FrontendUploadStatusType): boolean =>
  isInFlightStatus(status);
