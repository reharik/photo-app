import { enumeration } from '@reharik/smart-enum';
const input = ['queued', 'creating', 'uploading', 'finalizing', 'complete', 'failed'];
export const FrontendUploadStatus = enumeration('FrontendUploadStatus', {
    input: input,
});
//# sourceMappingURL=frontendUploadStatus.js.map