import type { Knex } from 'knex';

/**
 * Collapse `share_link` into `access_grant.link_token`.
 *
 * A public link is not a separate entity — it is an authorization whose grantee is
 * "bearer of this token" rather than "this user". `access_grant` already XORs
 * media_item_id/album_id and 1:1-joined `share_link` only genuinely owned `link_token`
 * (all other columns — album_id, granted_by, created_by, expires_at, revoked_at, timestamps —
 * duplicate what `access_grant` already carries; verified zero divergence in data before writing).
 *
 * Target state:
 *   - access_grant gains `link_token` (nullable); grantee invariant becomes granted_to_user XOR link_token.
 *   - access_grant.share_link_id dropped.
 *   - grant.share_link_id dropped outright (it had NO query readers — only grantSync wrote it and a
 *     CHECK/index referenced it). The public read path joins grant -> access_grant on access_grant_id
 *     and filters access_grant.link_token; grant no longer denormalizes the token.
 *   - grant's `grant_one_recipient` XOR is dropped (a public-link grant row is now identified purely by
 *     its non-null access_grant_id; granted_to_user stays null for those rows).
 *   - share_link and the (empty, runtime-unused) share_link_grant join table dropped.
 *
 * ⚠️ ATOMIC CHANGESET — this migration MUST deploy together with the code that reads `link_token`
 * instead of `share_link_id` / the `share_link` table. Every one of these breaks the moment it runs:
 *   - queryHelpers/withActivePublicLink.ts            (ag.shareLinkId = publicLinkId)
 *   - readRepositories/publicMediaItemReadRepository (accessGrant.shareLinkId = publicLinkId)
 *   - readRepositories/authorizationReadRepository   (ag.share_link_id = publicLinkId)
 *   - readRepositories/publicAccessReadRepository    (joins/queries the share_link table)
 *   - readRepositories/grantReadRepository           (joins the share_link table by linkToken)
 *   - domainRepositories/albumRepositoryMappings     (publicLinkSelectColumns from shareLink.*)
 *   - repositories/grantSync.ts                      (must STOP writing grant.shareLinkId)
 *   - apps/api/src/services/authService.ts           (publicAccess: looks up share_link by hashed token)
 * ⚠️ SCOPE IDENTITY CHANGE: the request-scoped `publicLinkId` is currently share_link.id (resolved from
 *   the token by authService.publicAccess). With share_link gone, that identity must become the token
 *   itself; every `*.share_link_id = publicLinkId` filter becomes `*.link_token = <hashed token>`.
 *   Note: link_token stores the HASHED token (authService hashes before lookup) — backfill preserves it.
 *
 * DOWN is functionally reversible (share_link rebuilt from access_grant, 1:1 relinked by unique
 * link_token) EXCEPT that recreated share_link.id values are freshly generated — the original UUIDs
 * are unrecoverable. Nothing outside these FK columns referenced share_link.id, so this is safe, but
 * it is not a byte-for-byte restore.
 */
export async function up(knex: Knex): Promise<void> {
  // --- access_grant: introduce link_token, backfill from share_link ---
  await knex.schema.alterTable('access_grant', (table) => {
    table.text('link_token').nullable();
  });

  await knex.raw(`
    UPDATE access_grant
    SET link_token = sl.link_token
    FROM share_link sl
    WHERE sl.id = access_grant.share_link_id
  `);

  // Tokens are globally unique; nulls (user grants) must not collide.
  await knex.raw(`
    CREATE UNIQUE INDEX access_grant_link_token_unique
    ON access_grant (link_token)
    WHERE link_token IS NOT NULL
  `);

  // New grantee invariant — exactly one of granted_to_user / link_token.
  // Style matches the existing access_grant_media_xor_album_check.
  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_grantee_xor_check
    CHECK (
      (granted_to_user IS NOT NULL AND link_token IS NULL) OR
      (granted_to_user IS NULL AND link_token IS NOT NULL)
    )
  `);

  // --- access_grant: drop share_link_id (unique constraint + FK + column) ---
  await knex.raw(`
    ALTER TABLE "access_grant"
    DROP CONSTRAINT access_grant_share_link_id_unique
  `);
  await knex.schema.alterTable('access_grant', (table) => {
    // dropColumn also removes access_grant_share_link_id_foreign.
    table.dropColumn('share_link_id');
  });

  // --- grant: drop the recipient XOR, the share_link_id index, and the column ---
  await knex.raw(`
    ALTER TABLE "grant"
    DROP CONSTRAINT grant_one_recipient
  `);
  await knex.schema.alterTable('grant', (table) => {
    table.dropIndex(['share_link_id', 'media_item_id']);
    // dropColumn also removes grant_share_link_id_foreign.
    table.dropColumn('share_link_id');
  });

  // --- drop share_link_grant (empty, runtime-unused; FK to share_link) then share_link ---
  await knex.schema.dropTableIfExists('share_link_grant');
  await knex.schema.dropTableIfExists('share_link');
}

export async function down(knex: Knex): Promise<void> {
  // --- recreate share_link (DDL per 0001_init_schema) ---
  await knex.schema.createTable('share_link', (table) => {
    table.uuid('id').primary();
    table.text('link_token').notNullable().unique();
    table.uuid('album_id').nullable().references('id').inTable('album').onDelete('CASCADE');
    table.index(['album_id']);
    table.uuid('created_by').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.uuid('granted_by').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.index(['granted_by']);
    table.uuid('updated_by').notNullable().references('id').inTable('user').onDelete('CASCADE');
    table.timestamp('expires_at', { useTz: false }).nullable();
    table.timestamp('revoked_at', { useTz: false }).nullable();
    table.timestamp('created_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: false }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('share_link_grant', (table) => {
    table.uuid('id').primary();
    table
      .uuid('share_link_id')
      .notNullable()
      .references('id')
      .inTable('share_link')
      .onDelete('CASCADE');
    table
      .uuid('access_grant_id')
      .notNullable()
      .references('id')
      .inTable('access_grant')
      .onDelete('CASCADE');
    table.index(['share_link_id']);
    table.index(['access_grant_id']);
  });

  // --- access_grant: re-add share_link_id ---
  await knex.schema.alterTable('access_grant', (table) => {
    table
      .uuid('share_link_id')
      .nullable()
      .references('id')
      .inTable('share_link')
      .onDelete('SET NULL');
  });

  // Rebuild one share_link row per token-bearing access_grant. Original share_link.id values are
  // unrecoverable, so fresh UUIDs are generated; the 1:1 link is restored by matching link_token.
  await knex.raw(`
    INSERT INTO share_link (
      id, link_token, album_id, created_by, granted_by, updated_by,
      expires_at, revoked_at, created_at, updated_at
    )
    SELECT
      gen_random_uuid(), ag.link_token, ag.album_id, ag.created_by, ag.granted_by, ag.updated_by,
      ag.expires_at, ag.revoked_at, ag.created_at, ag.updated_at
    FROM access_grant ag
    WHERE ag.link_token IS NOT NULL
  `);

  await knex.raw(`
    UPDATE access_grant
    SET share_link_id = sl.id
    FROM share_link sl
    WHERE sl.link_token = access_grant.link_token
  `);

  await knex.raw(`
    ALTER TABLE "access_grant"
    ADD CONSTRAINT access_grant_share_link_id_unique UNIQUE (share_link_id)
  `);

  // --- grant: re-add share_link_id, backfill from access_grant, restore index + XOR ---
  await knex.schema.alterTable('grant', (table) => {
    table
      .uuid('share_link_id')
      .nullable()
      .references('id')
      .inTable('share_link')
      .onDelete('CASCADE');
  });

  await knex.raw(`
    UPDATE "grant" g
    SET share_link_id = ag.share_link_id
    FROM access_grant ag
    WHERE ag.id = g.access_grant_id
      AND ag.share_link_id IS NOT NULL
  `);

  await knex.schema.alterTable('grant', (table) => {
    table.index(['share_link_id', 'media_item_id']);
  });

  await knex.raw(`
    ALTER TABLE "grant"
    ADD CONSTRAINT grant_one_recipient
    CHECK (num_nonnulls(granted_to_user, share_link_id) = 1)
  `);

  // --- access_grant: drop link_token (grantee check + partial unique index + column) ---
  await knex.raw(`
    ALTER TABLE "access_grant"
    DROP CONSTRAINT access_grant_grantee_xor_check
  `);
  await knex.raw('DROP INDEX IF EXISTS access_grant_link_token_unique');
  await knex.schema.alterTable('access_grant', (table) => {
    table.dropColumn('link_token');
  });
}
