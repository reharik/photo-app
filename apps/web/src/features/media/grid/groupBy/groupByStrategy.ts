import { GroupResult, GroupStrategy } from './groupByStrategyTypes';

export const groupNodes = <T, V, K extends string>(
  nodes: T[],
  s: GroupStrategy<T, V, K>,
): GroupResult<T>[] => {
  const items = new Map<K, T[]>();
  const values = new Map<K, V[]>();
  for (const n of nodes) {
    const v = s.extract(n);
    if (v == null) continue; // your null-takenAt / no-lastName exclusion
    const k = s.keyOf(v);
    const itemBucket = items.get(k) ?? [];
    itemBucket.push(n);
    items.set(k, itemBucket);

    const valBucket = values.get(k) ?? [];
    valBucket.push(v);
    values.set(k, valBucket);
  }
  return [...items.keys()].sort(s.compareKeys).map((k) => ({
    key: k,
    label: s.labelOf(k),
    subtitle: s.subtitleOf(k, values.get(k)!),
    items: items.get(k)!,
  }));
};
