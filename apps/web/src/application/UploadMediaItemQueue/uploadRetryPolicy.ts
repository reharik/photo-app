import { ContractError, FrontendError, FrontendUploadStatus } from '@packages/contracts';
import type { AppError } from '../../domain/errors/errorTypes';
import type { UploadItem } from './mediaUploadTypes';

const QUOTA_ERROR_CODE = ContractError.InsufficientStorageSpace.value;

/**
 * Failures a retry can't fix, matched on {@link AppError.code}. Items rejected by the
 * enqueue pre-check never reached the network, and a quota failure won't clear until the
 * user frees space.
 */
const NON_RETRYABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  FrontendError.unsupportedMediaType.value,
  FrontendError.videoNotSupported.value,
  QUOTA_ERROR_CODE,
]);

export const canRetryUploadItem = (item: UploadItem): boolean =>
  item.status.equals(FrontendUploadStatus.failed) &&
  !(item.errors ?? []).some((error) => NON_RETRYABLE_ERROR_CODES.has(error.code));

/**
 * A presign failure that dooms everything still queued, not just its own chunk: once the
 * quota is exceeded, a later (smaller) chunk must not slip through.
 */
export const stopsUploadQueue = (errors: AppError[]): boolean =>
  errors.some((error) => error.code === QUOTA_ERROR_CODE);
