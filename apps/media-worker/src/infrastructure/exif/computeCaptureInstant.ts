import { Capture } from '@packages/worker-core';
import { DateTime } from 'luxon';

export const nullCapture = (): Capture => ({
  takenAtUtc: undefined,
  takenAtUtcOffsetMinutes: undefined,
});

/** EXIF writes "2026:09:28 14:30:00"; video tags are already ISO. */
const toIso = (value: string): string => {
  if (!value.includes(' ')) return value;
  const [date, time] = value.split(' ');
  return `${date.replaceAll(':', '-')}T${time}`;
};

/** "Z" says the value is UTC, not where it was shot — only a real offset does. */
const hasOffset = (iso: string): boolean => {
  const t = iso.indexOf('T');
  if (t === -1) return false;
  const time = iso.slice(t);
  return time.includes('+') || time.includes('-');
};

const parse = (value: string): DateTime => DateTime.fromISO(value, { setZone: true, zone: 'utc' });

export const computeCaptureInstant = (
  dateStr: string | undefined,
  offsetStr: string | undefined,
): Capture => {
  if (dateStr === undefined) {
    return nullCapture();
  }

  const iso = toIso(dateStr.trim());
  const suffix = offsetStr?.trim() ?? '';

  // A malformed offset is dropped rather than invalidating the whole value —
  // a bad offset shouldn't cost us a good capture time.
  const withOffset = suffix ? parse(iso + suffix) : undefined;
  const parsed = withOffset?.isValid ? withOffset : parse(iso);

  if (!parsed.isValid) {
    return nullCapture();
  }

  const offsetKnown = withOffset?.isValid === true || hasOffset(iso);

  return {
    takenAtUtc: parsed.toUTC().toJSDate(),
    takenAtUtcOffsetMinutes: offsetKnown ? parsed.offset : undefined,
  };
};
