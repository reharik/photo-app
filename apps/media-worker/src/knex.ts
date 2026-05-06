import knex, { type Knex } from 'knex';
import { IocGeneratedCradle } from './di/generated/ioc-registry.types';

export const build__Database = ({ knexConfig }: IocGeneratedCradle): Knex => knex(knexConfig);
