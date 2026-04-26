import { enumeration } from '@reharik/smart-enum';
import { ErrorCategory } from './graphqlSmartEnums';
const frontendErrorInput = {
    networkError: {
        code: 'NETWORK_ERROR',
        message: 'Network error',
        category: ErrorCategory.network,
        retryable: false,
        source: 'frontend',
    },
    finalizeFailed: {
        code: 'FINALIZE_FAILED',
        message: 'Finalize media upload returned an invalid payload.',
        category: ErrorCategory.validation,
        retryable: false,
        source: 'frontend',
    },
    uploadFailed: {
        code: 'UPLOAD_FAILED',
        message: `Upload failed.`,
        category: ErrorCategory.validation,
        retryable: false,
        source: 'frontend',
    },
    invalidCreateMediaUploadPayload: {
        code: 'INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD',
        message: 'Create media upload returned an invalid payload.',
        category: ErrorCategory.validation,
        retryable: false,
        source: 'frontend',
    },
    unsupportedMediaType: {
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Only image and video uploads are supported.',
        category: ErrorCategory.validation,
        retryable: false,
        source: 'frontend',
    },
};
export const FrontendError = enumeration('FrontendError', {
    input: frontendErrorInput,
});
//# sourceMappingURL=FrontendError.js.map