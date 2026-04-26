import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.createTable('share_contact', (table) => {
    table.uuid('user_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table
      .uuid('contact_user_id')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.text('handle').notNullable();
    table.timestamp('last_shared_at', { useTz: true }).notNullable();

    table.primary(['user_id', 'contact_user_id']);
    table.index(['user_id', 'last_shared_at']);
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('share_contact');
};
