import type { Knex } from 'knex';

/**
 * Rename `album.is_public_link_album` -> `album.is_shadow_album`.
 *
 * The flag never meant "this album is public". It marks a SYNTHETIC album the system
 * created to carry loose media items, which the owner must not see in their own album
 * collection (see albumReadRepository.listByViewerId). Two paths now create one:
 *   - createPublicLinkForMediaItems  (a genuine public link)
 *   - grantUserAuthorization         (sharing loose items with a named user — no link
 *                                     involved at all for an active recipient)
 * Since the second case is neither public nor a link, the old name actively misled.
 *
 * ⚠️ ATOMIC CHANGESET — this migration MUST deploy together with the code that reads
 * `is_shadow_album` (same hazard 0018 carries). Renames are not backward compatible:
 * remote-deploy.sh runs the `migrate` one-shot BEFORE `up -d --force-recreate`, so
 * between those two steps the old api container is serving against the new column name
 * and any query touching it errors. That window is bounded by the api recreate, which
 * every migration-bearing deploy performs (migrations live under apps/api/**, which
 * detect-changed-deploy-targets maps to service `api`).
 *
 * The DDL itself is metadata-only: Postgres rewrites no rows for a column rename, so it
 * is instant at any table size. It does take a brief ACCESS EXCLUSIVE lock, so it queues
 * behind any long-running transaction holding `album`.
 *
 * Not exposed through GraphQL — no schema/codegen impact.
 */
export const up = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('album', (table) => {
    table.renameColumn('is_public_link_album', 'is_shadow_album');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.alterTable('album', (table) => {
    table.renameColumn('is_shadow_album', 'is_public_link_album');
  });
};
