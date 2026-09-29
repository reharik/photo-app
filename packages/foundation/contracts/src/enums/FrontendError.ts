import { enumeration, type Enumeration } from '@reharik/smart-enum';
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
  videoNotSupported: {
    code: 'VIDEO_NOT_SUPPORTED',
    message: 'Videos aren’t supported yet — photos only.',
    category: ErrorCategory.validation,
    retryable: false,
    source: 'frontend',
  },
  /**
   * The server gave up on the item's derivatives (status FAILED). Not retryable from the
   * widget: Retry re-uploads as a new media item and orphans this one.
   *
   * WORKAROUND — sets `display`, not `message` like the entries above. `mapToAppError`
   * (apps/web/src/domain/errors/mapToError.ts) builds the user-facing text from
   * `def.display`, and smart-enum ignores `message` for that: `display` falls back to the
   * title-cased key ("Video Not Supported"). So every sibling's `message` wording is never
   * shown. When mapToAppError is fixed to read `message`, move this text to `message` to
   * match the rest.
   */
  mediaProcessingFailed: {
    code: 'MEDIA_PROCESSING_FAILED',
    display: 'Uploaded, but we couldn’t process this file.',
    category: ErrorCategory.system,
    retryable: false,
    source: 'frontend',
  },
} as const;
export type FrontendError = Enumeration<typeof FrontendError>;
export const FrontendError = enumeration<typeof frontendErrorInput>('FrontendError', {
  input: frontendErrorInput,
});
