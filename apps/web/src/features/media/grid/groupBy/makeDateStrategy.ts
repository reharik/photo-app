import { DateTime } from 'luxon';
import { formatActivityDate, formatActivityMonthYear } from '../../../../ui/dateDisplay';
import { groupNodes, groupNodesByEncounterOrder } from './groupByStrategy';
import {
  GroupResult,
  MediaGridDateBucketKey,
  MediaGridGroupBy,
  NamedGroupStrategy,
} from './groupByStrategyTypes';

const DATE_BUCKET_ORDER: MediaGridDateBucketKey[] = ['today', 'yesterday', 'lastWeek', 'thisMonth'];

const formatSubtitleRange = (min: DateTime, max: DateTime): string => {
  if (min.hasSame(max, 'day')) {
    return formatActivityDate(min);
  }
  return `${formatActivityDate(min)} to ${formatActivityDate(max)}`;
};

const resolveBucketKey = (createdAt: DateTime, now: DateTime): MediaGridDateBucketKey => {
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

const bucketLabel = (key: MediaGridDateBucketKey): string => {
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
        return formatActivityMonthYear(
          DateTime.fromObject({
            month: Number(month),
            year: Number(year),
          }),
        );
      }
      if (key.startsWith('year:')) {
        return key.slice('year:'.length);
      }
      return '';
    }
  }
};

const bucketSubtitle = (key: MediaGridDateBucketKey, dates: DateTime[], now: DateTime): string => {
  if (dates.length === 0) {
    return '';
  }
  const sorted = [...dates].sort((a, b) => a.toMillis() - b.toMillis());
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  switch (key) {
    case 'today':
      return formatActivityDate(now);
    case 'yesterday':
      return formatActivityDate(now.minus({ days: 1 }));
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

const rankDateKey = (k: MediaGridDateBucketKey): [number, number, number] => {
  const fixed = DATE_BUCKET_ORDER.indexOf(k);
  if (fixed !== -1) return [0, fixed, 0]; // today…thisMonth, in order
  if (k.startsWith('month:')) {
    const [, m, y] = k.split(':').map(Number);
    return [1, -y, -m]; // newer year, then newer month
  }
  const y = Number(k.slice('year:'.length));
  return [2, -y, 0]; // years last, newest first
};

const dateKeyComparator = (a: MediaGridDateBucketKey, b: MediaGridDateBucketKey): number => {
  const ra = rankDateKey(a);
  const rb = rankDateKey(b);
  return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2];
};

const buildTakenDateGroupStrategy = <T>(
  extract: (n: T) => DateTime | undefined,
  now: DateTime,
) => ({
  extract: (n: T) => {
    const d = extract(n);
    return d && d.isValid ? d : undefined;
  },
  keyOf: (d: DateTime) => resolveBucketKey(d, now),
  labelOf: bucketLabel,
  subtitleOf: (k: MediaGridDateBucketKey, dates: DateTime[]) => bucketSubtitle(k, dates, now),
  compareKeys: dateKeyComparator,
});

export const makeDateStrategy = <T>(
  key: MediaGridGroupBy,
  extract: (n: T) => DateTime | undefined,
  now: DateTime = DateTime.now(),
): NamedGroupStrategy<T> => ({
  key,
  group: (nodes) =>
    groupNodes<T, DateTime, MediaGridDateBucketKey>(
      nodes,
      buildTakenDateGroupStrategy(extract, now),
    ),
});

/** Preserve server sort order; null takenAt → single "Unknown date" section pinned to top. */
export const groupByTakenDatePreservingOrder = <T>(
  nodes: T[],
  extract: (n: T) => DateTime | undefined,
  now: DateTime = DateTime.now(),
): GroupResult<T>[] =>
  groupNodesByEncounterOrder(nodes, {
    ...buildTakenDateGroupStrategy(extract, now),
    orphanLabel: 'Unknown date',
  });
