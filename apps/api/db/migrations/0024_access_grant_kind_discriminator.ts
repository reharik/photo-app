import type { Knex } from 'knex';

/**
 * Add `access_grant.kind` — an explicit discriminator for the THREE authorization kinds.
 *
 * Until now the kind was inferred from column nullness, and the schema only admitted two
 * shapes. 0018's `access_grant_grantee_xor_check` enforced granted_to_user XOR link_token,
 * which makes the pending-user kind (BOTH populated) unrepresentable — PendingUserAuthorization
 * rows cannot be inserted at all. The three real kinds are:
 *
 *   USER    -> granted_to_user NOT NULL, link_token NULL      (a membership-ish direct grant)
 *   PENDING -> granted_to_user NOT NULL, link_token NOT NULL  (invited user, not yet signed up)
 *   PUBLIC  -> granted_to_user NULL,     link_token NOT NULL  (share link, no named grantee)
 *
 * Stored as text (varchar 32) holding the smart-enum wire value in constantCase, per the
 * baseline convention stated in 0001 ("Use string/varchar columns for enum-like fields. Do
 * NOT use Postgres enum types") and matching 0019's `user.user_status`. No DB default —
 * the domain always sets kind explicitly.
 *
 * No separate `kind IN (...)` check is added: access_grant_kind_grantee_check below already
 * admits exactly those three literals (any other value satisfies none of its branches).
 *
 * ---
 *
 * Both scope-unique indexes also change. 0001 created NON-PARTIAL uniques on
 * (album_id, granted_to_user) and (media_item_id, granted_to_user). Conversion inserts the
 * new USER row while the PENDING row it replaces still holds the same (scope, user) pair, so
 * the insert collides inside the same transaction. The invariant we actually want is one
 * MEMBERSHIP per user per scope — a pending authorization is not a membership — so both
 * indexes become partial on kind = 'USER'. Shares are item-scoped as well as album-scoped
 * (Authorization carries target: AlbumTarget | ItemTarget), so the media-item axis hits the
 * identical abort and gets the identical fix.
 * (Reordering childEntities() and a DEFERRABLE constraint were both considered and rejected.)
 *
 * Both are renamed on the way through:
 *   access_grant_album_granted_user_unique      -> access_grant_album_membership_unique
 *   access_grant_media_item_granted_user_unique -> access_grant_media_item_membership_unique
 * The old names claim "one row per (scope, user)", which is no longer true. The new names say
 * membership, so the narrowing is legible without reading the WHERE clause.
 *
 * ⚠️ ATOMIC CHANGESET — deploys with the code that writes `kind` (same hazard as 0018/0023).
 * `kind` is NOT NULL with no default, so between the migrate one-shot and the api recreate
 * the old container cannot insert into access_grant at all.
 *
 * ⚠️ down() restores 0018's XOR check and WILL FAIL if any kind = 'PENDING' rows exist —
 * that check is precisely what forbids them. Delete or convert pending rows before rolling
 * back.
 */
export const up = async (knex: Knex): Promise<void> => {
  // Nullable first, backfill, then tighten. The local DB has zero access_grant rows so the
  // backfill is a no-op, but adding a NOT NULL column with no default to a populated table
  // fails outright — this sequence (the 0019 pattern) is safe in every environment.
  await knex.schema.alterTable('access_grant', (table) => {
    table.string('kind', 32).nullable();
  });

  await knex('access_grant')
    .whereNotNull('granted_to_user')
    .whereNull('link_token')
    .update({ kind: 'USER' });

  await knex('access_grant')
    .whereNotNull('granted_to_user')
    .whereNotNull('link_token')
    .update({ kind: 'PENDING' });

  await knex('access_grant')
    .whereNull('granted_to_user')
    .whereNotNull('link_token')
    .update({ kind: 'PUBLIC' });

  // A row with neither populated maps to no kind and is left NULL on purpose: the alter
  // below then fails loudly rather than this migration inventing a classification.
  await knex.schema.alterTable('access_grant', (table) => {
    table.string('kind', 32).notNullable().alter();
  });

  // --- grantee invariant: kind-aware, replaces the two-state XOR ---
  await knex.raw(`
    ALTER TABLE "access_grant"
    DROP CONSTRAINT access_grant_grantee_xor_check
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_kind_grantee_check
    CHECK (
      (kind = 'USER'    AND granted_to_user IS NOT NULL AND link_token IS NULL) OR
      (kind = 'PENDING' AND granted_to_user IS NOT NULL AND link_token IS NOT NULL) OR
      (kind = 'PUBLIC'  AND granted_to_user IS NULL     AND link_token IS NOT NULL)
    )
  `);

  // --- one membership per user per scope: partial, so PENDING rows don't collide ---
  await knex.raw('DROP INDEX access_grant_album_granted_user_unique');

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_membership_unique
    ON access_grant (album_id, granted_to_user)
    WHERE kind = 'USER'
  `);

  await knex.raw('DROP INDEX access_grant_media_item_granted_user_unique');

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_media_item_membership_unique
    ON access_grant (media_item_id, granted_to_user)
    WHERE kind = 'USER'
  `);
};

export const down = async (knex: Knex): Promise<void> => {
  // Restore both to their pre-0024 definitions: original names, non-partial.
  await knex.raw('DROP INDEX access_grant_album_membership_unique');

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_granted_user_unique
    ON access_grant (album_id, granted_to_user)
  `);

  await knex.raw('DROP INDEX access_grant_media_item_membership_unique');

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_media_item_granted_user_unique
    ON access_grant (media_item_id, granted_to_user)
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    DROP CONSTRAINT access_grant_kind_grantee_check
  `);

  // Fails if any PENDING rows exist — see the header note.
  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_grantee_xor_check
    CHECK (
      (granted_to_user IS NOT NULL AND link_token IS NULL) OR
      (granted_to_user IS NULL AND link_token IS NOT NULL)
    )
  `);

  await knex.schema.alterTable('access_grant', (table) => {
    table.dropColumn('kind');
  });
};
