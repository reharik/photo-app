import type { Knex } from 'knex';

/**
 * Add `access_grant.origin` — provenance discriminator for PUBLIC rows.
 *
 * Two provenances of anonymous token-bearing (kind = 'PUBLIC') rows exist and the table
 * cannot currently tell them apart:
 *
 *   OWNER     -> minted by an explicit "create public link" action; the single canonical
 *                link the UI shows and the owner copies.
 *   CONVERTED -> was a PENDING (named, email-shared) authorization whose grantee signed up.
 *                On conversion it sheds granted_to_user and becomes anonymous, joining the
 *                pool. Its token is deliberately NOT revoked — revoking would break the link
 *                for anyone downstream who received a forward.
 *
 * "Get the album's public link" must return the OWNER one; returning an arbitrary pool
 * member would hand the owner someone else's forwarded token to paste publicly. Neither
 * created_at (converted rows keep their original timestamp) nor granted_by (it correctly
 * records the original sharer; overloading it would make the audit trail lie) can serve as
 * the discriminator, hence the explicit column.
 *
 * Stored as varchar(32) holding the constantCase wire value, per the baseline convention in
 * 0001 ("Use string/varchar columns for enum-like fields. Do NOT use Postgres enum types")
 * and matching 0024's `kind`. The 0024 access_grant_kind_grantee_check is deliberately left
 * untouched: an origin value on a USER or PENDING row is meaningless rather than dangerous,
 * and adding a fourth clause buys nothing.
 *
 * The partial unique index enforces at most one LIVE canonical link per album. All three
 * WHERE clauses are load-bearing: the reset operation revokes every anonymous token on the
 * album and mints a fresh OWNER one inside a single transaction, and the revoked_at clause
 * is what lets the old and new rows coexist mid-transaction — without it the insert would
 * collide with the row it is replacing.
 *
 * ⚠️ down() is LOSSY — origin cannot be reconstructed once dropped (that irrecoverability
 * is the entire reason the column exists).
 */
export const up = async (knex: Knex): Promise<void> => {
  // Nullable first, backfill, then tighten (the 0019/0024 pattern). Adding a NOT NULL
  // column with no default to a populated table fails outright, and this runs against prod.
  await knex.schema.alterTable('access_grant', (table) => {
    table.string('origin', 32).nullable();
  });

  // USER and PENDING rows are never converted, so 'OWNER' is the honest value for them.
  // PUBLIC rows cannot be classified — that unclassifiability is what this migration
  // exists to fix — so they are left NULL on purpose: the NOT NULL alter below then fails
  // loudly rather than this migration inventing a classification.
  await knex('access_grant').whereIn('kind', ['USER', 'PENDING']).update({ origin: 'OWNER' });

  await knex.schema.alterTable('access_grant', (table) => {
    table.string('origin', 32).notNullable().alter();
  });

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_canonical_public_link_unique
    ON access_grant (album_id)
    WHERE kind = 'PUBLIC' AND origin = 'OWNER' AND revoked_at IS NULL
  `);
};

// Lossy: origin cannot be reconstructed once dropped — see the header note.
export const down = async (knex: Knex): Promise<void> => {
  await knex.raw('DROP INDEX access_grant_album_canonical_public_link_unique');

  await knex.schema.alterTable('access_grant', (table) => {
    table.dropColumn('origin');
  });
};
