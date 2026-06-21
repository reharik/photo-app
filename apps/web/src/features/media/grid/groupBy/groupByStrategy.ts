import { GroupResult, GroupStrategy } from './groupByStrategyTypes';
export const groupNodes = <T, V, K extends string>(
  nodes: T[],
  s: GroupStrategy<T, V, K>,
): GroupResult<T>[] => {
  const items = new Map<K, T[]>();
  const values = new Map<K, V[]>();
  const orphans: T[] = [];

  for (const n of nodes) {
    const v = s.extract(n);
    if (v == null) {
      orphans.push(n); // accumulate, don't continue-drop
      continue;
    }
    const k = s.keyOf(v);
    const itemBucket = items.get(k) ?? [];
    itemBucket.push(n);
    items.set(k, itemBucket);
    const valBucket = values.get(k) ?? [];
    valBucket.push(v);
    values.set(k, valBucket);
  }

  const groups = [...items.keys()].sort(s.compareKeys).map((k) => ({
    key: k,
    label: s.labelOf(k),
    subtitle: s.subtitleOf(k, values.get(k)!),
    items: items.get(k)!,
  }));

  if (orphans.length > 0) {
    groups.unshift({
      key: 'noDate' as K, // see type-hole note
      label: s.orphanLabel ?? 'No date',
      subtitle: '',
      items: orphans,
    });
  }

  return groups;
};

/** Bucket order follows first appearance in `nodes` (server sort). Orphans pinned to top. */
export const groupNodesByEncounterOrder = <T, V, K extends string>(
  nodes: T[],
  s: GroupStrategy<T, V, K>,
): GroupResult<T>[] => {
  const items = new Map<K, T[]>();
  const values = new Map<K, V[]>();
  const orphans: T[] = [];
  const keyOrder: K[] = [];

  for (const n of nodes) {
    const v = s.extract(n);
    if (v == null) {
      orphans.push(n);
      continue;
    }
    const k = s.keyOf(v);
    if (!items.has(k)) {
      keyOrder.push(k);
    }
    const itemBucket = items.get(k) ?? [];
    itemBucket.push(n);
    items.set(k, itemBucket);
    const valBucket = values.get(k) ?? [];
    valBucket.push(v);
    values.set(k, valBucket);
  }

  const groups = keyOrder.map((k) => ({
    key: k,
    label: s.labelOf(k),
    subtitle: s.subtitleOf(k, values.get(k)!),
    items: items.get(k)!,
  }));

  if (orphans.length > 0) {
    groups.unshift({
      key: 'unknownDate' as K,
      label: s.orphanLabel ?? 'Unknown date',
      subtitle: '',
      items: orphans,
    });
  }

  return groups;
};
