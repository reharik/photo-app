import { ContractError, FrontendError, FrontendUploadStatus } from '@packages/contracts';
import type { AppError } from '../../domain/errors/errorTypes';
import type { UploadItem } from './mediaUploadTypes';

const QUOTA_ERROR_CODE = ContractError.InsufficientStorageSpace.value;

/**
 * Failures a retry can't fix, matched on {@link AppError.code}. Items rejected by the
 * enqueue pre-check never reached the network, a quota failure won't clear until the
 * user frees space, and a file over the size cap is over it just as far on the next attempt —
 * offering Retry there only buys the same refusal a second time.
 */
const NON_RETRYABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  FrontendError.unsupportedMediaType.value,
  FrontendError.videoNotSupported.value,
  QUOTA_ERROR_CODE,
  ContractError.ImageSizeTooLarge.value,
  ContractError.VideoSizeTooLarge.value,
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
