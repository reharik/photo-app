import { StandardEnumItem } from '@reharik/smart-enum';

export const notEmpty = <T>(x: T): x is NonNullable<T> => x != null;

export const assertNever = (x: never): never => {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`);
};

type Handlers<T extends { kind: string }, R, C> = {
  [K in T['kind']]: (t: Extract<T, { kind: K }>, ctx: C) => R;
};
/*
match(authorization.target, {
    album: (t, m) => m.get(t.albumId)?.map((x) => x.mediaItemId) ?? [],
    mediaItem: (t) => [t.mediaItemId],
  }, itemsByAlbum);
*/
export const match = <T extends { kind: string }, R, C>(
  t: T,
  handlers: Handlers<T, R, C>,
  ctx: C,
): R => (handlers[t.kind as T['kind']] as (t: T, c: C) => R)(t, ctx);

export const partitionByMember = <TRow, TField extends keyof TRow, TItem extends StandardEnumItem>(
  rows: readonly TRow[],
  field: TField,
  subset: { has(x: unknown): x is TItem },
): {
  matched: (TRow & { [P in TField]: TItem })[];
  rest: (TRow & { [P in TField]: Exclude<TRow[TField], TItem> })[];
} => {
  const matched: (TRow & { [P in TField]: TItem })[] = [];
  const rest: (TRow & { [P in TField]: Exclude<TRow[TField], TItem> })[] = [];
  for (const r of rows) {
    if (subset.has(r[field])) {
      matched.push(r as TRow & { [P in TField]: TItem });
    } else {
      rest.push(r as TRow & { [P in TField]: Exclude<TRow[TField], TItem> });
    }
  }
  return { matched, rest };
};

export const filterByMember = <TRow, TField extends keyof TRow, TItem extends StandardEnumItem>(
  rows: readonly TRow[],
  field: TField,
  subset: { has(x: unknown): x is TItem },
): (TRow & { [P in TField]: TItem })[] => {
  return rows.filter((r): r is TRow & { [P in TField]: TItem } => subset.has(r[field]));
};

export const isMember = <TObj, TField extends keyof TObj, TItem extends StandardEnumItem>(
  obj: TObj,
  field: TField,
  subset: { has(x: unknown): x is TItem },
): obj is TObj & { [P in TField]: TItem } => {
  return subset.has(obj[field]);
};
