export type MediaGridDateBucketKey =
  | 'today'
  | 'yesterday'
  | 'lastWeek'
  | 'thisMonth'
  | `month:${number}:${number}`
  | `year:${number}`;

export type MediaGridGroupBy = 'lastName' | 'fullName' | 'createdDate' | 'takenDate';
export type GroupResult<T> = {
  key: string;
  label: string;
  subtitle: string;
  items: T[];
};

export interface GroupStrategy<T, V, K extends string> {
  extract: (node: T) => V | undefined; // T → value  (only T-aware step)
  keyOf: (value: V) => K; // value → bucket key
  labelOf: (key: K) => string; // key → header
  subtitleOf: (key: K, members: V[]) => string; // key + members → subline
  compareKeys: (a: K, b: K) => number; // bucket order
}

export type NamedGroupStrategy<T> = {
  key: MediaGridGroupBy;
  group: (nodes: T[]) => GroupResult<T>[];
};
