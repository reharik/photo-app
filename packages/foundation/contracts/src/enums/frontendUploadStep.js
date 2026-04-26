import { enumeration } from '@reharik/smart-enum';
import { FrontendUploadStatus } from './frontendUploadStatus';
const input = {
    create: {
        start: FrontendUploadStatus.creating,
        end: FrontendUploadStatus.uploading,
        stage: FrontendUploadStatus.creating,
        fail: FrontendUploadStatus.failed,
    },
    upload: {
        start: FrontendUploadStatus.uploading,
        end: FrontendUploadStatus.finalizing,
        stage: FrontendUploadStatus.uploading,
        fail: FrontendUploadStatus.failed,
    },
    finalize: {
        start: FrontendUploadStatus.finalizing,
        end: FrontendUploadStatus.complete,
        stage: FrontendUploadStatus.finalizing,
        fail: FrontendUploadStatus.failed,
    },
};
export const FrontendUploadStep = enumeration('FrontendUploadStep', {
    input,
});
//# sourceMappingURL=frontendUploadStep.js.map