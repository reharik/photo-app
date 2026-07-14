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
