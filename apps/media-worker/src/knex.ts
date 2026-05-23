import knex, { type Knex } from 'knex';
import type { AppCradle } from './generated/ioc-composed.js';

export const build__Database = ({ knexConfig }: AppCradle): Knex => knex(knexConfig);
