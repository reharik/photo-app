import { enumeration, type Enumeration } from '@reharik/smart-enum';

const frontendErrorInput = {
  networkError: {
    code: 'NETWORK_ERROR',
    message: 'Network error',
    category: 'SYSTEM',
    retryable: false,
    source: 'frontend',
  },
  finalizeFailed: {
    code: 'FINALIZE_FAILED',
    message: 'Finalize media upload returned an invalid payload.',
    category: 'VALIDATION',
    retryable: false,
    source: 'frontend',
  },
  uploadFailed: {
    code: 'UPLOAD_FAILED',
    message: `Upload failed.`,
    category: 'VALIDATION',
    retryable: false,
    source: 'frontend',
  },
  invalidCreateMediaUploadPayload: {
    code: 'INVALID_CREATE_MEDIA_UPLOAD_PAYLOAD',
    message: 'Create media upload returned an invalid payload.',
    category: 'VALIDATION',
    retryable: false,
    source: 'frontend',
  },
  unsupportedMediaType: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    message: 'Only image and video uploads are supported.',
    category: 'VALIDATION',
    retryable: false,
    source: 'frontend',
  },
} as const;
export type FrontendError = Enumeration<typeof FrontendError>;
export const FrontendError = enumeration<typeof frontendErrorInput>('FrontendError', {
  input: frontendErrorInput,
});
