import { groupNodes } from './groupByStrategy';
import { MediaGridGroupBy, NamedGroupStrategy } from './groupByStrategyTypes';

export const makeStringStrategy = <T>(
  key: MediaGridGroupBy,
  extract: (n: T) => string | undefined,
): NamedGroupStrategy<T> => {
  return {
    key,
    group: (nodes: T[]) =>
      groupNodes<T, string, string>(nodes, {
        extract,
        keyOf: (v: string) => v,
        labelOf: (k: string) => k,
        subtitleOf: (_k: string, m: string[]) =>
          `${m.length} ${m.length === 1 ? 'photo' : 'photos'}`,
        compareKeys: (a: string, b: string) => a.localeCompare(b),
      }),
  };
};
