import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.raw(`
    ALTER TABLE "access_grant"
    DROP CONSTRAINT access_grant_permission_check
  `);

  await knex.schema.alterTable('access_grant', (table) => {
    table.renameColumn('permission', 'operations');
  });

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_operations_check
    CHECK (operations IN ('VIEW', 'COMMENT', 'DOWNLOAD'))
  `);

  await knex.schema.alterTable('grant', (table) => {
    table.renameColumn('permissions', 'operations');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.raw(`
    ALTER TABLE "access_grant"
    DROP CONSTRAINT access_grant_operations_check
  `);

  await knex.schema.alterTable('access_grant', (table) => {
    table.renameColumn('operations', 'permission');
  });

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_permission_check
    CHECK (permission IN ('VIEW', 'COMMENT', 'DOWNLOAD'))
  `);

  await knex.schema.alterTable('grant', (table) => {
    table.renameColumn('operations', 'permissions');
  });
};
