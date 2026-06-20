import { GroupResult, MediaGridGroupBy, NamedGroupStrategy } from './groupByStrategyTypes';

export const strategyRunner = <T>(
  nodes: T[],
  strategies: NamedGroupStrategy<T>[],
  key: MediaGridGroupBy,
): GroupResult<T>[] => {
  const found = strategies.find((s) => s.key === key);
  return found ? found.group(nodes) : [];
};
