import type { Knex } from 'knex';

// share_contact schema change (schema only — no app/repo/domain code touched):
//   * Drop the composite PK (user_id, contact_user_id).
//   * Make contact_user_id nullable.
//   * Add a UNIQUE constraint on (user_id, handle).
//
// Both FKs are left intact (user_id and contact_user_id both stay
// ON DELETE CASCADE; the contact_user_id FK is unaffected by nulls — a NULL FK
// value is simply not enforced). The (user_id, last_shared_at) index is left
// intact.
//
// Real Postgres-assigned names (inspected on the live schema, not assumed):
//   PK    share_contact_pkey                          btree (user_id, contact_user_id)
//   idx   share_contact_user_id_last_shared_at_index  btree (user_id, last_shared_at)   [untouched]
//   fk    share_contact_user_id_foreign               (user_id)         -> user(id) CASCADE  [untouched]
//   fk    share_contact_contact_user_id_foreign       (contact_user_id) -> user(id) CASCADE  [untouched]

const TABLE = 'share_contact';
const PK_NAME = 'share_contact_pkey';
const UNIQUE_NAME = 'share_contact_user_id_handle_unique';

export async function up(knex: Knex): Promise<void> {
  // 1. Drop the composite primary key by its real, Postgres-assigned name. This
  //    also drops the implicit btree that backed the PK. That btree was on
  //    (user_id, contact_user_id) — a leading-column index that was NOT usable
  //    for lookups on contact_user_id alone, so the contact_user_id FK's
  //    cascade-delete never had a usable index and is not made worse here.
  await knex.raw(`ALTER TABLE ${TABLE} DROP CONSTRAINT ${PK_NAME}`);

  // 2. Allow contact_user_id to be null.
  await knex.raw(`ALTER TABLE ${TABLE} ALTER COLUMN contact_user_id DROP NOT NULL`);

  // 3. Add the UNIQUE constraint on (user_id, handle). Verified at authoring
  //    time that no duplicate (user_id, handle) rows exist, so this applies
  //    cleanly. If a duplicate is introduced before this runs, apply will fail
  //    here rather than silently dedupe — intentional.
  await knex.raw(
    `ALTER TABLE ${TABLE} ADD CONSTRAINT ${UNIQUE_NAME} UNIQUE (user_id, handle)`,
  );
}

export async function down(knex: Knex): Promise<void> {
  // Reverse order.
  await knex.raw(`ALTER TABLE ${TABLE} DROP CONSTRAINT ${UNIQUE_NAME}`);

  // Restore NOT NULL on contact_user_id.
  // NOTE: this will FAIL if any rows with a NULL contact_user_id exist by the
  // time down() runs. The composite PK restored below likewise cannot include
  // NULL key columns. If the nullable window has been used, such rows must be
  // reconciled (backfilled or removed) manually before this rollback can apply.
  await knex.raw(`ALTER TABLE ${TABLE} ALTER COLUMN contact_user_id SET NOT NULL`);

  // Restore the composite primary key (Postgres re-derives the share_contact_pkey name).
  await knex.raw(
    `ALTER TABLE ${TABLE} ADD CONSTRAINT ${PK_NAME} PRIMARY KEY (user_id, contact_user_id)`,
  );
}
