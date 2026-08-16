import type { Knex } from 'knex';

/**
 * Add `revoked_at IS NULL` to both membership partial uniques from 0024.
 *
 * 0024 narrowed the scope-uniques to `WHERE kind = 'USER'` but left revoked rows inside
 * the predicate, so a revoked USER grant permanently occupies its (scope, granted_to_user)
 * slot. Revocation is a soft delete (revokeShareService sets revoked_at; the row survives),
 * which means re-invite-and-accept is blocked: activatePendingUserAuthorization inserts a
 * fresh USER row for the same (album_id, granted_to_user) pair and aborts on the unique.
 * The invariant we want is one LIVE membership per user per scope — revoked history rows
 * are not memberships and must not reserve the slot.
 *
 * Predicate literals stay CONSTANT_CASE ('USER') — the smart-enum wire format actually
 * stored in `kind`. 0027 exists because a predicate once used lowercase literals and
 * silently enforced nothing; don't reintroduce that.
 *
 * The new predicate is strictly narrower than the old one, so rows that satisfied 0024's
 * index always satisfy this one — up() cannot fail on existing data.
 *
 * ⚠️ down() restores 0024's broader predicate and WILL FAIL if any (scope, user) pair by
 * then holds both a revoked and a live USER row — exactly the state this migration exists
 * to permit. Delete the revoked duplicates before rolling back.
 */
export const up = async (knex: Knex): Promise<void> => {
  await knex.raw('DROP INDEX access_grant_album_membership_unique');

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_membership_unique
    ON access_grant (album_id, granted_to_user)
    WHERE kind = 'USER' AND revoked_at IS NULL
  `);

  await knex.raw('DROP INDEX access_grant_media_item_membership_unique');

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_media_item_membership_unique
    ON access_grant (media_item_id, granted_to_user)
    WHERE kind = 'USER' AND revoked_at IS NULL
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  // Restore both to their 0024 definitions — see the header note for when this fails.
  await knex.raw('DROP INDEX access_grant_album_membership_unique');

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_membership_unique
    ON access_grant (album_id, granted_to_user)
    WHERE kind = 'USER'
  `);

  await knex.raw('DROP INDEX access_grant_media_item_membership_unique');

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_media_item_membership_unique
    ON access_grant (media_item_id, granted_to_user)
    WHERE kind = 'USER'
  `);
};
