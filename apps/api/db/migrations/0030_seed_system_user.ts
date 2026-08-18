import type { Knex } from 'knex';

// Seed the well-known system actor row.
//
// Worker processes (notification batcher, scheduled sweeps) write audited
// records but have no current viewer, so they have no actor id to stamp into
// `created_by` / `updated_by`. This row is that actor. It is reference data,
// not a fixture — it must exist in every environment including production —
// which is why it ships as a migration rather than a seed.
//
// The id is fixed and duplicated as `SYSTEM_ACTOR_ID` in
// `packages/foundation/contracts/src/types/systemActor.ts`. Application code
// must reference the constant; the literal is repeated here only because a
// migration cannot depend on app code without pinning that code's shape into
// migration history.

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000001';

export async function up(knex: Knex): Promise<void> {
  // Supplies exactly the NOT NULL / no-default columns on `user`:
  // id, email, first_name, last_name, user_status, created_by, updated_by.
  //
  // `password_hash` is omitted (left NULL) on purpose. It is a nullable column,
  // and `authQueryService.login` short-circuits on `if (!user || !user.passwordHash)`
  // before it ever reaches `bcrypt.compare` — so NULL is strictly stronger than
  // any sentinel string, which would still be a value someone could theoretically
  // preimage. There is nothing to authenticate against.
  //
  // `email` satisfies `user_email_lowercase_check` (already lowercase) and cannot
  // collide with `user_email_unique`: it is not an address a real signup can hold.
  //
  // `user_status` must be a `UserStatus` smart-enum wire value ('ACTIVE' | 'PENDING')
  // — the read repositories revive this column through `withEnumRevival` and throw
  // on anything else. 'ACTIVE' is correct: PENDING means "invited, not yet signed
  // up" and would make the row a candidate for activation flows.
  //
  // `created_by` / `updated_by` self-reference. Safe: unlike most audit columns in
  // this schema, `user.created_by` / `user.updated_by` carry no foreign key
  // (0001_init_schema), so there is no ordering constraint to satisfy.
  await knex('user')
    .insert({
      id: SYSTEM_ACTOR_ID,
      email: 'system@homeroll.app',
      first_name: 'System',
      last_name: 'User',
      user_status: 'ACTIVE',
      created_by: SYSTEM_ACTOR_ID,
      updated_by: SYSTEM_ACTOR_ID,
    })
    // Re-runnable against a database that already has the row.
    .onConflict('id')
    .ignore();
}

export async function down(knex: Knex): Promise<void> {
  await knex('user').where({ id: SYSTEM_ACTOR_ID }).delete();
}
