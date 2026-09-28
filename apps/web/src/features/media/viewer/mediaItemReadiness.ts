import { MediaItemStatus } from '@packages/contracts';

/**
 * What the viewer can do with an item, by status. Derivatives (display, thumbnail)
 * exist only once an item is READY; before that, requesting them only earns an
 * S3 error after the /api/media redirect.
 *
 * - `ready`: render it.
 * - `processing`: still on its way (uploading or in the worker queue) — worth polling.
 * - `failed`: processing gave up; it won't become viewable.
 * - `unavailable`: being deleted, or deletion failed.
 */
export type MediaItemReadiness = 'ready' | 'processing' | 'failed' | 'unavailable';

export const getMediaItemReadiness = (status: MediaItemStatus): MediaItemReadiness => {
  if (status.equals(MediaItemStatus.ready)) {
    return 'ready';
  }
  if (
    status.equals(MediaItemStatus.pending) ||
    status.equals(MediaItemStatus.uploaded) ||
    status.equals(MediaItemStatus.processing)
  ) {
    return 'processing';
  }
  if (status.equals(MediaItemStatus.failed)) {
    return 'failed';
  }
  return 'unavailable';
};
