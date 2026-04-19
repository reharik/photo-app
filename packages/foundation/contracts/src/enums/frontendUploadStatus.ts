import { enumeration, type Enumeration } from '@reharik/smart-enum';
const input = ['queued', 'creating', 'uploading', 'finalizing', 'complete', 'failed'] as const;

export type FrontendUploadStatus = Enumeration<typeof FrontendUploadStatus>;
export const FrontendUploadStatus = enumeration<typeof input>('FrontendUploadStatus', {
  input: input,
});
