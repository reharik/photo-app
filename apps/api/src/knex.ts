import knex, { type Knex } from 'knex';
import { format } from 'sql-formatter';

import { Config } from './config.js';
import type { KnexConfig } from './knexfile.js';
type PgError = Error & { code?: string; detail?: string; where?: string; routine?: string };

type DatabaseDeps = {
  knexConfig: KnexConfig;
  config: Config;
};

export const build__Database = ({ knexConfig, config }: DatabaseDeps): Knex => {
  const instance = knex(knexConfig);
  if (config.isDevelopment) {
    instance.on('query-error', (err: PgError, obj: Knex.Sql) => {
      let sql = obj?.sql ?? '';
      try {
        sql = format(sql, { language: 'postgresql' });
      } catch {
        /* keep raw sql */
      }
      console.error(sql, '\n', obj?.bindings, '\n', err.message);
    });
  }
  return instance;
};
