import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { ErrorCategory } from './ContractError';

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
  videoNotSupported: {
    code: 'VIDEO_NOT_SUPPORTED',
    message: 'Videos aren’t supported yet — photos only.',
    category: ErrorCategory.validation,
    retryable: false,
    source: 'frontend',
  },
} as const;
export type FrontendError = Enumeration<typeof FrontendError>;
export const FrontendError = enumeration<typeof frontendErrorInput>('FrontendError', {
  input: frontendErrorInput,
});
