import knex, { type Knex } from 'knex';
import type { KnexConfig } from './knexfile.js';

type DatabaseDeps = {
  knexConfig: KnexConfig;
};

export const build__Database = ({ knexConfig }: DatabaseDeps): Knex => knex(knexConfig);
