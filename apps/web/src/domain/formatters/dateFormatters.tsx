import { DateTime } from 'luxon';

export const localizeDate = (value: string): string => {
  const dt = DateTime.fromISO(value);
  if (dt.isValid) {
    return dt.toLocaleString(DateTime.DATE_MED);
  }
  return '—';
};
