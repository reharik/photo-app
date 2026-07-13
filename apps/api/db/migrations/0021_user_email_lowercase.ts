import type { Knex } from 'knex';

// Enforce that user.email is stored lowercase, and (together with the existing
// unique constraint) therefore case-insensitively unique.
//
// Background: `user.email` was created `notNullable().unique()` in
// 0001_init_schema (constraint `user_email_unique`). That uniqueness is
// case-sensitive at the DB level — 'A@x.com' and 'a@x.com' are two distinct
// rows. This migration closes that gap by requiring every stored email to
// equal its own lowercase form. Once the CHECK holds, the pre-existing unique
// constraint is effectively case-insensitive as well, so no separate functional
// unique index is needed.

const TABLE = 'user';
const CHECK_NAME = 'user_email_lowercase_check';

export async function up(knex: Knex): Promise<void> {
  // 1. Backfill any mixed-case addresses to lowercase FIRST, so the CHECK
  //    applies cleanly. NOTE: if two rows differ only by case (e.g. 'A@x.com'
  //    and 'a@x.com'), lowercasing collides on the existing `user_email_unique`
  //    constraint and this UPDATE will fail here. That is intentional — such a
  //    collision must be reconciled by hand rather than silently dropped.
  await knex('user')
    .whereRaw('email <> lower(email)')
    .update({ email: knex.raw('lower(email)') });

  // 2. Add the CHECK constraint enforcing lowercase going forward.
  await knex.raw(
    `ALTER TABLE "${TABLE}" ADD CONSTRAINT ${CHECK_NAME} CHECK (email = lower(email))`,
  );
}

export async function down(knex: Knex): Promise<void> {
  // The lowercase backfill is not reversed (original casing is unrecoverable).
  await knex.raw(`ALTER TABLE "${TABLE}" DROP CONSTRAINT ${CHECK_NAME}`);
}
