import { enumeration, type Enumeration } from '@reharik/smart-enum';
const input = {
  queued: { display: 'Waiting' },
  creating: { display: 'Preparing' },
  uploading: { display: 'Uploading' },
  finalizing: { display: 'Finishing' },
  complete: { display: 'Processing' },
  ready: { display: 'Done' },
  failed: { display: 'Failed' },
} as const;

export type FrontendUploadStatus = Enumeration<typeof FrontendUploadStatus>;
export const FrontendUploadStatus = enumeration<typeof input>('FrontendUploadStatus', {
  input: input,
});

export const isInFlightStatus = (status: FrontendUploadStatus): boolean =>
  status.equals(FrontendUploadStatus.queued) ||
  status.equals(FrontendUploadStatus.creating) ||
  status.equals(FrontendUploadStatus.uploading) ||
  status.equals(FrontendUploadStatus.finalizing);

export const isTerminalStatus = (status: FrontendUploadStatus): boolean =>
  status.equals(FrontendUploadStatus.ready) || status.equals(FrontendUploadStatus.failed);
