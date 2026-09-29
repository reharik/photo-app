/**
 * Delay before the next processing-status request, by time since polling began. Photos go
 * ready in a few seconds, so poll hot at first; video transcodes take minutes, so back off
 * after that. Shared by the upload widget's per-item wait and the grids' processing watch.
 */
export const nextProcessingPollDelayMs = (elapsedMs: number): number => {
  if (elapsedMs < 30_000) {
    return 1500;
  }
  if (elapsedMs < 180_000) {
    return 5000;
  }
  return 15_000;
};
