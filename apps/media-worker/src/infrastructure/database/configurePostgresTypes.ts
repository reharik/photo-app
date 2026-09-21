// src/infrastructure/database/configurePostgresTypes.ts
import pg from 'pg';

let configured = false;

export const configurePostgresTypes = (): void => {
  if (configured) return;
  configured = true;

  const { types } = pg;

  // timestamp without time zone
  types.setTypeParser(1114, (value) => new Date(`${value}Z`));

  // timestamp with time zone
  types.setTypeParser(1184, (value) => new Date(value));

  // int8 / bigint (also COUNT(*) and SUM(bigint)) -> number. Throws rather than rounding
  // past 2^53, so a bigint column that can exceed that must be selected as `::text`
  // (album_item.order_index is).
  types.setTypeParser(20, (value) => {
    const n = Number(value);
    if (!Number.isSafeInteger(n)) {
      throw new Error(`int8 value ${value} exceeds Number.MAX_SAFE_INTEGER; select it ::text`);
    }
    return n;
  });
};
