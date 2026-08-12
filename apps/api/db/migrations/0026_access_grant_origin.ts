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
 *
 * ── Legacy data note ────────────────────────────────────────────────────────────────────
 * An earlier revision of this migration left PUBLIC rows NULL on purpose, so the NOT NULL
 * alter would fail loudly rather than invent a classification. Against prod it did exactly
 * that, which was the design working — and it surfaced two facts that make the correct
 * classification unambiguous:
 *
 *   1. Every pre-existing row predates the pending-user conversion flow, so NOTHING can
 *      legitimately be 'CONVERTED'. All existing rows are 'OWNER' by construction.
 *
 *   2. The old "create shareable link" action minted a FRESH token on every click, so an
 *      album can hold several live public tokens (prod had one album with four, all minted
 *      within four hours of each other and all carrying {DOWNLOAD,COMMENT} — an operation
 *      set the current view-only model no longer produces). The canonical-link model allows
 *      exactly one live OWNER token per album, so the surplus must be revoked or the partial
 *      unique index below cannot be created.
 *
 * The backfill therefore keeps the NEWEST public token per album as the canonical OWNER link
 * and revokes the rest. Revoked rows still receive origin = 'OWNER' because the column is
 * NOT NULL; the index ignores them via its revoked_at clause.
 */
export const up = async (knex: Knex): Promise<void> => {
  // Nullable first, backfill, then tighten (the 0019/0024 pattern). Adding a NOT NULL
  // column with no default to a populated table fails outright, and this runs against prod.
  await knex.schema.alterTable('access_grant', (table) => {
    table.string('origin', 32).nullable();
  });

  // USER and PENDING rows are never converted — 'OWNER' is the honest value.
  await knex('access_grant').whereIn('kind', ['USER', 'PENDING']).update({ origin: 'OWNER' });

  // PUBLIC rows: keep the newest live token per album as the canonical OWNER link.
  await knex.raw(`
    WITH ranked AS (
      SELECT id, row_number() OVER (PARTITION BY album_id ORDER BY created_at DESC) AS rn
      FROM access_grant
      WHERE kind = 'PUBLIC' AND revoked_at IS NULL
    )
    UPDATE access_grant
    SET origin = 'OWNER'
    WHERE id IN (SELECT id FROM ranked WHERE rn = 1)
  `);

  // Surplus live public tokens from the old mint-per-click behaviour: revoke them. They keep
  // origin = 'OWNER' (NOT NULL) but drop out of the partial unique index via revoked_at.
  await knex.raw(`
    WITH ranked AS (
      SELECT id, row_number() OVER (PARTITION BY album_id ORDER BY created_at DESC) AS rn
      FROM access_grant
      WHERE kind = 'PUBLIC' AND revoked_at IS NULL
    )
    UPDATE access_grant
    SET origin = 'OWNER', revoked_at = now()
    WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
  `);

  // Grant rows for the tokens just revoked must go with them. Revocation without projection
  // teardown fails OPEN — the authorization reads as revoked while `grant` still permits
  // access, and the lazy-on-read reconciler cannot heal it (it detects MISSING grants, not
  // EXTRA ones). Same transaction as the revoke, by the same reasoning the revoke services use.
  await knex.raw(`
    DELETE FROM "grant"
    WHERE access_grant_id IN (
      SELECT id FROM access_grant WHERE kind = 'PUBLIC' AND revoked_at IS NOT NULL
    )
  `);

  // Any PUBLIC row already revoked before this migration ran still needs a value.
  await knex('access_grant').whereNull('origin').update({ origin: 'OWNER' });

  await knex.schema.alterTable('access_grant', (table) => {
    table.string('origin', 32).notNullable().alter();
  });

  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_album_canonical_public_link_unique
    ON access_grant (album_id)
    WHERE kind = 'PUBLIC' AND origin = 'OWNER' AND revoked_at IS NULL
  `);
};

// Lossy: origin cannot be reconstructed once dropped — see the header note. The revocations
// and grant deletions performed by up() are NOT undone; they were data corrections, not
// schema changes, and the pre-existing surplus tokens are not recoverable.
export const down = async (knex: Knex): Promise<void> => {
  await knex.raw('DROP INDEX access_grant_album_canonical_public_link_unique');

  await knex.schema.alterTable('access_grant', (table) => {
    table.dropColumn('origin');
  });
};
