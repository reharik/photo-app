interface HasId {
  id: string;
}

export function indexBy<T extends HasId>(items: T[]): Map<string, T>;
export function indexBy<T, K>(items: T[], key: (item: T) => K): Map<K, T>;
export function indexBy<T, K>(items: T[], key?: (item: T) => K) {
  const keyFn = key ?? ((item: T) => (item as unknown as HasId).id);
  return new Map(items.map((item) => [keyFn(item), item]));
}

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
