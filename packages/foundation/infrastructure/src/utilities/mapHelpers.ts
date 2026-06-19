import { StandardEnumItem } from '@reharik/smart-enum';

/**
 * Array-to-Map indexing utilities.
 *
 * These exist because the codebase frequently needs to look up domain objects
 * by key — joining a parent's children to it during rehydration, reconciling a
 * loaded collection against a new one during persistence, matching rows across
 * tables, deduping. The naive `array.find(x => x.id === someId)` inside a loop
 * is O(n*m) and reads poorly; building a Map once and looking up by key is O(n)
 * and states the intent directly.
 *
 * All three default their key function to `item.id` (via the `HasId` constraint),
 * since keying by entity id is by far the most common case. Pass an explicit key
 * function for anything else — composite keys, value-object natural keys, foreign
 * keys, etc.
 *
 * The overload signatures preserve the key type: with no key function the Map is
 * keyed by `string` (the id); with a key function the Map is keyed by whatever
 * that function returns.
 */
interface HasId {
  id: string;
}

/**
 * Index items into a Map by key, last-write-wins on collisions.
 *
 * Use when duplicate keys are possible or simply don't matter and you want the
 * most recent. For "there must not be duplicates," use `indexByUnique` instead so
 * a violated assumption fails loudly rather than silently dropping a row.
 *
 *   indexBy(albumItems)                       // Map<id, AlbumItem>
 *   indexBy(rows, r => `${r.albumId}:${r.userTagId}`)  // Map<compositeKey, Row>
 */
export function indexBy<T extends HasId>(items: T[]): Map<string, T>;
export function indexBy<T, K>(items: T[], key: (item: T) => K): Map<K, T>;
export function indexBy<T, K>(items: T[], key?: (item: T) => K) {
  const keyFn = key ?? ((item: T) => (item as unknown as HasId).id);
  return new Map(items.map((item) => [keyFn(item), item]));
}

/**
 * Index items into a Map by key, throwing if any key appears more than once.
 *
 * Use when the key is supposed to be unique and a duplicate indicates a bug
 * upstream (e.g. two rows that should have been deduped, two entities sharing an
 * id). Failing fast here surfaces the bug at the point of the bad data rather
 * than letting a silent overwrite cause a confusing symptom much later.
 */
export function indexByUnique<T extends HasId>(items: T[]): Map<string, T>;
export function indexByUnique<T, K>(items: T[], key: (item: T) => K): Map<K, T>;
export function indexByUnique<T, K>(items: T[], key?: (item: T) => K): Map<string | K, T> {
  const keyFn = key ?? ((item: T) => (item as unknown as HasId).id);
  const map = new Map<string | K, T>();
  for (const item of items) {
    const k = keyFn(item);
    if (map.has(k)) {
      throw new Error(`indexByUnique: duplicate key ${String(k)}`);
    }
    map.set(k, item);
  }
  return map;
}

/**
 * Group items into a Map of key -> array, preserving insertion order within each
 * group. Optionally project each item to a value before grouping.
 *
 * Use for one-to-many shaping: bucketing child rows by their parent id before
 * attaching them to parents during rehydration, grouping grants by authorization,
 * collecting tags by media item, etc. The two-arg form groups whole items; the
 * three-arg form groups a projected value (e.g. group rows by parentId but keep
 * only the mapped domain object in each bucket).
 *
 *   groupByMapping(itemRows, r => r.albumId)              // Map<albumId, Row[]>
 *   groupByMapping(grantRows, r => r.authId, toGrant)     // Map<authId, Grant[]>
 */
export function groupByMapping<T extends HasId>(items: T[]): Map<string, T[]>;
export function groupByMapping<T, K>(items: T[], key: (item: T) => K): Map<K, T[]>;
export function groupByMapping<T, K, V>(
  items: T[],
  key: (item: T) => K,
  value: (item: T) => V,
): Map<K, V[]>;
export function groupByMapping<T, K, V>(
  items: T[],
  key?: (item: T) => K,
  value?: (item: T) => V,
): Map<K | string, (V | T)[]> {
  const keyFn = key ?? ((item: T) => (item as unknown as HasId).id);
  const valueFn = value ?? ((item: T) => item);
  const map = new Map<K | string, (V | T)[]>();
  for (const item of items) {
    const k = keyFn(item);
    const v = valueFn(item);
    const existing = map.get(k);
    if (existing) existing.push(v);
    else map.set(k, [v]);
  }
  return map;
}

export const EnumArraysAreEqual = <E extends StandardEnumItem>(a: E[], b: E[]): boolean => {
  const av = new Set(a.map((e) => e.value));
  const bv = new Set(b.map((e) => e.value));
  return av.size === bv.size && [...av].every((v) => bv.has(v));
};

export const dedupeIds = <T>(ids: T[]): T[] => {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};

export const dedupeBy = <T extends object>(items: T[], keys: Array<(item: T) => unknown>): T[] => [
  ...items
    .reduce((m, item) => {
      const key = keys.map((k) => k(item)).join('\x1f');
      return m.set(key, item);
    }, new Map<string, T>())
    .values(),
];
