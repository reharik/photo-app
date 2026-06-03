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
};

export const getUploadProgressCounts = (items: UploadItem[]): UploadProgressCounts => {
  let finished = 0;
  let inFlight = 0;
  let failed = 0;
  let processing = 0;

  for (const item of items) {
    if (
      item.status.equals(FrontendUploadStatus.ready) ||
      item.status.equals(FrontendUploadStatus.complete)
    ) {
      finished += 1;
    }
    if (item.status.equals(FrontendUploadStatus.complete)) {
      processing += 1;
    }
    if (isInFlightStatus(item.status)) {
      inFlight += 1;
    }
    if (item.status.equals(FrontendUploadStatus.failed)) {
      failed += 1;
    }
  }

  return { total: items.length, finished, inFlight, failed, processing };
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

export const canCancelUpload = (status: FrontendUploadStatusType): boolean =>
  isInFlightStatus(status);

export const canRetryUpload = (status: FrontendUploadStatusType): boolean =>
  status.equals(FrontendUploadStatus.failed);
