/**
 * dateDisplay — the single source of truth for formatting dates in the UI.
 *
 * There are exactly TWO kinds of date in this app. Pick the matching helper;
 * never hand-roll formatting at a call site again.
 *
 *   1. CAPTURE-ANCHORED — when/where a photo was taken.
 *      Offset-aware, viewer-INDEPENDENT. A photo taken at 4:03 PM in Beirut
 *      reads "4:03 PM" for every viewer, in Austin or anywhere else. We express
 *      the stored UTC instant at the photo's own captured offset; the viewer's
 *      browser zone is deliberately never consulted.
 *
 *   2. VIEWER-RELATIVE — activity timestamps (comments, reactions, shares).
 *      Anchored to the viewer's now, formatted in the viewer's local zone,
 *      relative ("5 minutes ago") for recent events.
 *
 * The capture helpers take takenAt and offsetMinutes together, on purpose:
 * the date and its offset are an inseparable pair. Never format one without
 * the other, or you reintroduce the "3 PM shows as 1 AM" bug.
 */

import { DateTime, FixedOffsetZone } from 'luxon';

type Instant = Date | string | number | DateTime;

/** Parse any wire/runtime value into a DateTime anchored to the correct instant. */
const toDateTime = (value: Instant): DateTime => {
  if (DateTime.isDateTime(value)) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (typeof value === 'number') return DateTime.fromMillis(value);
  // ISO string. If it carries an offset/Z, Luxon keeps the right instant;
  // if it's offset-less, interpret as UTC (matches how we store taken_at).
  return DateTime.fromISO(value, { zone: 'utc' });
};

const LOCALE = 'en-US';

// ---------------------------------------------------------------------------
// 1. CAPTURE-ANCHORED  (offset-aware, browser-zone-independent)
// ---------------------------------------------------------------------------

const CAPTURE_DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const CAPTURE_DATE_WITH_WEEKDAY_OPTS: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const CAPTURE_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

/**
 * The zone the photo was captured in. Sign convention matches our stored
 * column: positive = ahead of UTC (Beirut +180), negative = behind (Austin -360).
 * offsetMinutes === null → UTC, so the stored numerals read back verbatim.
 */
const captureZone = (offsetMinutes: number | null): FixedOffsetZone =>
  offsetMinutes == null ? FixedOffsetZone.utcInstance : FixedOffsetZone.instance(offsetMinutes);

/** "March 3, 2026" — capture-local date. null when no takenAt. */
export const formatCaptureDate = (
  takenAtUtc: Instant | null | undefined,
  offsetMinutes: number | null,
): string | null => {
  if (takenAtUtc == null) return null;
  const dt = toDateTime(takenAtUtc).setZone(captureZone(offsetMinutes));
  if (!dt.isValid) return null;
  return dt.setLocale(LOCALE).toLocaleString(CAPTURE_DATE_OPTS);
};

/** "Monday, March 3, 2026" — capture-local date with weekday. null when no takenAt. */
export const formatCaptureDateWithWeekday = (
  takenAtUtc: Instant | null | undefined,
  offsetMinutes: number | null,
): string | null => {
  if (takenAtUtc == null) return null;
  const dt = toDateTime(takenAtUtc).setZone(captureZone(offsetMinutes));
  if (!dt.isValid) return null;
  return dt.setLocale(LOCALE).toLocaleString(CAPTURE_DATE_WITH_WEEKDAY_OPTS);
};

/** "March 3, 2026 at 4:03 PM" — capture-local date+time. null when no takenAt. */
export const formatCaptureDateTime = (
  takenAtUtc: Instant | null | undefined,
  offsetMinutes: number | null,
): string | null => {
  if (takenAtUtc == null) return null;
  const dt = toDateTime(takenAtUtc).setZone(captureZone(offsetMinutes));
  if (!dt.isValid) return null;
  return dt.setLocale(LOCALE).toLocaleString(CAPTURE_DATETIME_OPTS);
};

/**
 * Whether a capture time has a known timezone. Use to drive a subtle
 * "timezone unknown" affordance so an unzoned photo doesn't pretend to a
 * precision it doesn't have.
 */
export const isCaptureZoneKnown = (offsetMinutes: number | null): boolean => offsetMinutes != null;

// ---------------------------------------------------------------------------
// 2. VIEWER-RELATIVE  (activity timestamps, viewer's local zone)
// ---------------------------------------------------------------------------

const ACTIVITY_DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

const ACTIVITY_MONTH_YEAR_OPTS: Intl.DateTimeFormatOptions = {
  month: 'long',
  year: 'numeric',
};

/** Viewer-local absolute date, e.g. "Mar 3, 2026". */
export const formatActivityDate = (instant: Instant): string => {
  const dt = toDateTime(instant).toLocal();
  if (!dt.isValid) return '';
  return dt.setLocale(LOCALE).toLocaleString(ACTIVITY_DATE_OPTS);
};

/** Viewer-local month+year heading, e.g. "June 2026". */
export const formatActivityMonthYear = (instant: Instant): string => {
  const dt = toDateTime(instant).toLocal();
  if (!dt.isValid) return '';
  return dt.setLocale(LOCALE).toLocaleString(ACTIVITY_MONTH_YEAR_OPTS);
};

/**
 * Relative for recent, absolute for older:
 * "just now" / "5 minutes ago" / "2 days ago" / "Mar 3, 2026".
 * Older than a week falls back to an absolute date — a "real long time ago"
 * is just a date at that point; relative phrasing stops being useful.
 */
export const formatActivityTime = (instant: Instant): string => {
  const dt = toDateTime(instant);
  if (!dt.isValid) return '';

  const secsAgo = Math.abs(dt.diffNow('seconds').seconds);
  if (secsAgo < 45) return 'just now';
  if (secsAgo < 7 * 86_400) return dt.setLocale(LOCALE).toRelative() ?? '';

  return formatActivityDate(instant); // older than a week → absolute, viewer-local
};
