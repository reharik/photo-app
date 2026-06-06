import { DateTime } from 'luxon';

export const isNonEmptyDisplayUrl = (url: string): boolean => url.trim().length > 0;

export const toDatetimeLocalValue = (dt?: DateTime): string => {
  if (!dt || !dt.isValid) {
    return '';
  }
  return dt.toFormat("yyyy-LL-dd'T'HH:mm");
};

export const fromDatetimeLocalToIso = (local: string): string | null => {
  const dt = DateTime.fromFormat(local.trim(), "yyyy-LL-dd'T'HH:mm");
  if (!dt.isValid) {
    return null;
  }
  return dt.toISO();
};

export const formatTakenDisplay = (takenAt?: DateTime): string => {
  if (!takenAt || !takenAt.isValid) {
    return '—';
  }
  return takenAt.toLocaleString(DateTime.DATETIME_MED);
};

export const formatMomentHeading = (takenAt?: DateTime): string | undefined => {
  if (!takenAt?.isValid) {
    return undefined;
  }
  return takenAt.toLocaleString(DateTime.DATE_FULL);
};

export const formatDateOnly = (dt?: DateTime): string | undefined => {
  if (!dt?.isValid) {
    return undefined;
  }
  return dt.toLocaleString(DateTime.DATE_MED);
};
