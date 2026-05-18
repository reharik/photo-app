import { PagedList } from '../services/readServices/types';
type WithTotalCount = { totalCount: number }; // confirm casing per issue 2

export const toPagedResult = <T extends WithTotalCount>(
  rows: T[],
): PagedList<Omit<T, 'totalCount'>> => {
  const totalCount = rows.length > 0 ? rows[0].totalCount : 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nodes = rows.map(({ totalCount, ...rest }) => rest);
  return { nodes, totalCount };
};
