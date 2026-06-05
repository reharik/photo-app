import { DateTime } from 'luxon';
import type { MediaItemSummaryVM } from '../../../viewModels/';
import type { LibraryDateBucket, LibraryDateBucketKey } from './libraryDateBucketTypes';

const BUCKET_ORDER: LibraryDateBucketKey[] = [
  'today',
  'yesterday',
  'lastWeek',
  'thisMonth',
];

const formatSubtitleDate = (dt: DateTime): string => dt.toLocaleString(DateTime.DATE_MED);

const formatSubtitleRange = (min: DateTime, max: DateTime): string => {
  if (min.hasSame(max, 'day')) {
    return formatSubtitleDate(min);
  }
  return `${formatSubtitleDate(min)} to ${formatSubtitleDate(max)}`;
};

const resolveBucketKey = (createdAt: DateTime, now: DateTime): LibraryDateBucketKey => {
  const todayStart = now.startOf('day');
  const yesterdayStart = todayStart.minus({ days: 1 });
  const lastWeekStart = todayStart.minus({ days: 7 });
  const monthStart = now.startOf('month');
  const yearStart = now.startOf('year');

  if (createdAt >= todayStart) {
    return 'today';
  }
  if (createdAt >= yesterdayStart) {
    return 'yesterday';
  }
  if (createdAt >= lastWeekStart) {
    return 'lastWeek';
  }
  if (createdAt >= monthStart) {
    return 'thisMonth';
  }
  if (createdAt >= yearStart) {
    return `month:${createdAt.month}:${createdAt.year}`;
  }
  return `year:${createdAt.year}`;
};

const bucketLabel = (key: LibraryDateBucketKey): string => {
  switch (key) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'lastWeek':
      return 'Last week';
    case 'thisMonth':
      return 'This month';
    default: {
      if (key.startsWith('month:')) {
        const [, month, year] = key.split(':');
        return DateTime.fromObject({
          month: Number(month),
          year: Number(year),
        }).toFormat('MMMM yyyy');
      }
      if (key.startsWith('year:')) {
        return key.slice('year:'.length);
      }
      return '';
    }
  }
};

const bucketSubtitle = (key: LibraryDateBucketKey, dates: DateTime[], now: DateTime): string => {
  if (dates.length === 0) {
    return '';
  }
  const sorted = [...dates].sort((a, b) => a.toMillis() - b.toMillis());
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  switch (key) {
    case 'today':
      return formatSubtitleDate(now);
    case 'yesterday':
      return formatSubtitleDate(now.minus({ days: 1 }));
    case 'lastWeek':
    case 'thisMonth':
      return formatSubtitleRange(min, max);
    default:
      if (key.startsWith('month:')) {
        return formatSubtitleRange(min, max);
      }
      return '';
  }
};

const sortBucketKeys = (keys: LibraryDateBucketKey[]): LibraryDateBucketKey[] => {
  const fixed = BUCKET_ORDER.filter((k) => keys.includes(k));
  const months = keys
    .filter((k): k is `month:${number}:${number}` => k.startsWith('month:'))
    .sort((a, b) => {
      const [, am, ay] = a.split(':').map(Number);
      const [, bm, by] = b.split(':').map(Number);
      if (ay !== by) {
        return by - ay;
      }
      return bm - am;
    });
  const years = keys
    .filter((k): k is `year:${number}` => k.startsWith('year:'))
    .sort((a, b) => Number(b.slice(5)) - Number(a.slice(5)));

  return [...fixed, ...months, ...years];
};

export const bucketMediaByDate = (nodes: MediaItemSummaryVM[]): LibraryDateBucket[] => {
  const now = DateTime.local();
  const groups = new Map<LibraryDateBucketKey, MediaItemSummaryVM[]>();
  const datesByKey = new Map<LibraryDateBucketKey, DateTime[]>();

  for (const item of nodes) {
    const createdAt = item.createdAt;
    if (createdAt == null || !createdAt.isValid) {
      continue;
    }
    const key = resolveBucketKey(createdAt, now);
    const bucketItems = groups.get(key) ?? [];
    bucketItems.push(item);
    groups.set(key, bucketItems);

    const bucketDates = datesByKey.get(key) ?? [];
    bucketDates.push(createdAt);
    datesByKey.set(key, bucketDates);
  }

  return sortBucketKeys([...groups.keys()]).map((key) => ({
    key,
    label: bucketLabel(key),
    subtitle: bucketSubtitle(key, datesByKey.get(key) ?? [], now),
    items: groups.get(key) ?? [],
  }));
};
