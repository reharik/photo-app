import { DateTime } from 'luxon';

export const isNonEmptyDisplayUrl = (url: string): boolean => url.trim().length > 0;

export const toDatetimeLocalValue = (iso: string | null | undefined): string => {
  if (iso == null || iso.trim() === '') {
    return '';
  }
  const dt = DateTime.fromISO(iso);
  if (!dt.isValid) {
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

export const formatTakenDisplay = (takenAt: string | null | undefined): string => {
  if (takenAt == null || takenAt.trim() === '') {
    return '—';
  }
  const dt = DateTime.fromISO(takenAt);
  if (!dt.isValid) {
    return '—';
  }
  return dt.toLocaleString(DateTime.DATETIME_MED);
};

export const formatDateOnly = (iso: string | null | undefined): string => {
  if (iso == null || iso.trim() === '') {
    return '—';
  }
  const dt = DateTime.fromISO(iso);
  if (!dt.isValid) {
    return '—';
  }
  return dt.toLocaleString(DateTime.DATE_MED);
};
