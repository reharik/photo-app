import { ContractError } from '@packages/contracts';

import type { AppError } from './errorTypes';

/**
 * 1024-based, matching how the caps are authored server-side (`52428800` is commented "50mb").
 * Labelling those units MB/GB is the same small lie every file manager tells, and it keeps the
 * number the user sees equal to the number the operator configured.
 */
const BYTE_UNITS = ['bytes', 'KB', 'MB', 'GB'] as const;

const formatByteSize = (bytes: number): string => {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? Math.round(value) : Math.round(value * 10) / 10} ${BYTE_UNITS[unit]}`;
};

/** `context` is server-supplied JSON, so nothing about its shape is guaranteed. */
const readByteCount = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;

const SIZE_LIMIT_NOUNS: ReadonlyMap<string, string> = new Map([
  [ContractError.ImageSizeTooLarge.value, 'photo'],
  [ContractError.VideoSizeTooLarge.value, 'video'],
]);

/**
 * The line a person reads. Most errors are already their catalog wording; a few carry structured
 * `context` that turns a flat statement ("Video size too large") into an actionable one, which is
 * the difference between the user shrugging and the user picking a different file.
 *
 * The limit is always read off the error. A client-side constant would be a second source of
 * truth for something the operator sets per environment (`IMAGE_MAX_BYTES` / `VIDEO_MAX_BYTES`),
 * and it would start lying the moment the two drifted. When `context` is missing or malformed,
 * this degrades to the catalog wording rather than guessing.
 */
export const formatAppErrorMessage = (error: AppError): string => {
  const noun = SIZE_LIMIT_NOUNS.get(error.code);
  if (noun == null) {
    return error.message;
  }

  const size = readByteCount(error.context?.size);
  const maxBytes = readByteCount(error.context?.maxBytes);
  if (size == null || maxBytes == null) {
    return error.message;
  }

  return `That ${noun} is ${formatByteSize(size)}; the limit is ${formatByteSize(maxBytes)}.`;
};
