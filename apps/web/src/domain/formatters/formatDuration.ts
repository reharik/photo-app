/**
 * A media duration as a clock string: "0:07", "1:23", "1:02:03".
 *
 * Takes milliseconds (media_item.duration_ms) and floors to whole seconds, so a
 * 59.9s clip reads "0:59" rather than rounding up to a minute it doesn't reach.
 * Hours appear only when needed; minutes are unpadded unless hours precede them.
 */
export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
};
