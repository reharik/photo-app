import type { MediaItemSummaryVM } from '../../../viewModels/';

export type LibraryDateBucketKey =
  | 'today'
  | 'yesterday'
  | 'lastWeek'
  | 'thisMonth'
  | `month:${number}:${number}`
  | `year:${number}`;

export type LibraryDateBucket = {
  key: LibraryDateBucketKey;
  label: string;
  subtitle: string;
  location?: string;
  items: MediaItemSummaryVM[];
};
