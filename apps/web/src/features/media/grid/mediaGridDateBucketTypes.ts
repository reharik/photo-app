import type { MediaItemSummaryVM } from '../../../viewModels/';

export type MediaGridDateBucketKey =
  | 'today'
  | 'yesterday'
  | 'lastWeek'
  | 'thisMonth'
  | `month:${number}:${number}`
  | `year:${number}`;

export type MediaGridDateBucket = {
  key: MediaGridDateBucketKey;
  label: string;
  subtitle: string;
  location?: string;
  items: MediaItemSummaryVM[];
};
