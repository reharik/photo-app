import type { Knex } from 'knex';

// Replaces the user-keyed `password_reset` table with an EMAIL-keyed
// `email_verification` table so a verification code can exist for an email that
// has no user row yet (signup / verify-before-account flows). Also adds a
// general-purpose `rate_limit_event` table backing throttles on public endpoints.
//
// Drop-and-recreate is intentional: the only rows in `password_reset` are
// single-use, 10-minute-TTL codes — nothing worth preserving. The code that uses
// these tables ships with this migration.
//
// FOLLOW-UP (do NOT add here): neither new table has an FK, so nothing cascades to
// clean them. Both need a periodic sweep (cron/worker task):
//   - email_verification: delete where expires_at < now()
//   - rate_limit_event:   delete where created_at < now() - <max throttle window>

export async function up(knex: Knex): Promise<void> {
  // 1. Drop the old user-keyed table (its FK to `user` and indexes go with it).
  await knex.schema.dropTableIfExists('password_reset');

  // 2. Email-keyed verification codes. No FK / no user_id, deliberately — an email
  //    with no account must be storable. Lookups are
  //    `where email = ? and consumed_at is null and expires_at > now()`, then the
  //    live row's code_hash is compared in app (no lookup by hash → no hash index).
  await knex.schema.createTable('email_verification', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('email').notNullable();
    table.text('code_hash').notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('consumed_at', { useTz: true }).nullable();
    table.integer('attempt_count').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['email', 'expires_at']);
  });

  // 3. General-purpose throttle backing table. A throttle counts hits per
  //    (bucket, key) within a time window, so the index leads with those and
  //    includes created_at for the windowed range scan.
  await knex.schema.createTable('rate_limit_event', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    // namespace, e.g. 'email_verification:issue'
    table.text('bucket').notNullable();
    // throttled identifier: normalized email, or IP
    table.text('key').notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['bucket', 'key', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('rate_limit_event');
  await knex.schema.dropTableIfExists('email_verification');

  // Recreate `password_reset` in its original 0009 shape so this migration is
  // reversible.
  await knex.schema.createTable('password_reset', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.text('code_hash').notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('consumed_at', { useTz: true }).nullable();
    table.integer('attempt_count').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id']);
    table.index(['code_hash']);
  });
}
