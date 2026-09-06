/** Sparse numeric ordering for album items (wide gaps for future inserts). */
export const ALBUM_ITEM_ORDER_INITIAL = 1_000_000_000_000n;
export const ALBUM_ITEM_ORDER_GAP = 1_000_000_000_000n;

export const albumItemOrderIndexForOrdinal = (zeroBasedOrdinal: number): bigint => {
  return ALBUM_ITEM_ORDER_INITIAL + BigInt(zeroBasedOrdinal) * ALBUM_ITEM_ORDER_GAP;
};
