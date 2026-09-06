import { Knex } from 'knex';

export const exists = async (qb: Knex.QueryBuilder): Promise<boolean> => (await qb.first()) != null;
