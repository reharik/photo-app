import { Enumeration, enumeration } from '@reharik/smart-enum';

const mediaJobStatusInput = ['pending', 'processing', 'succeeded', 'failed'] as const;
export type MediaJobStatus = Enumeration<typeof MediaJobStatus>;
export const MediaJobStatus = enumeration<typeof mediaJobStatusInput>('MediaJobStatus', {
  input: mediaJobStatusInput,
});

const workVerdictInput = ['processable', 'terminal', 'retryable', 'succeeded'] as const;
export type WorkVerdict = Enumeration<typeof WorkVerdict>;
export const WorkVerdict = enumeration<typeof workVerdictInput>('WorkVerdict', {
  input: workVerdictInput,
});

const mediaItemStatusInput = {
  deleteFailed: { work: WorkVerdict.terminal },
  deletePending: { work: WorkVerdict.terminal },
  failed: { work: WorkVerdict.terminal },
  pending: { work: WorkVerdict.terminal },
  processing: { work: WorkVerdict.processable },
  ready: { work: WorkVerdict.succeeded },
  uploaded: { work: WorkVerdict.terminal },
};

export type MediaItemStatus = Enumeration<typeof MediaItemStatus>;
export const MediaItemStatus = enumeration<typeof mediaItemStatusInput>('MediaItemStatus', {
  input: mediaItemStatusInput,
});
