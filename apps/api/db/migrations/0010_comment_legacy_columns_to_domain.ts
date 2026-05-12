import type { Knex } from 'knex';

const TABLE = 'comment';

/**
 * Upgrades the legacy `comment` stub from `0001_init_schema` (`resource_*`, `content`,
 * `author_id`) to the comments-domain column names used by services and `0009_comment`
 * (`target_*`, `body`, `author_user_id`), plus soft-delete, reply threading, and denormalized
 * `display_name` / `display_avatar_url` (snapshots; backfilled from `user` for existing rows).
 *
 * Self-referential FK uses `parent_comment_id` (not `parent_id`) to match `0009_comment`
 * and `packages/context/media-core` queries.
 *
 * No-ops when `target_type` already exists (e.g. full `0009_comment` has been applied).
 *
 * Note: If you need this upgrade on a DB that still has the 0001 stub, ensure `0009_comment`
 * does not run first — `0009` drops and recreates `comment`, which removes stub rows.
 */
export const up = async (knex: Knex): Promise<void> => {
  const hasModern = await knex.schema.hasColumn(TABLE, 'target_type');
  if (hasModern) {
    return;
  }

  const hasLegacyTarget = await knex.schema.hasColumn(TABLE, 'resource_type');
  if (!hasLegacyTarget) {
    return;
  }

  await knex.raw(`
    UPDATE ${TABLE}
    SET resource_type = upper(trim(resource_type))
  `);

  await knex.schema.alterTable(TABLE, (table) => {
    table.renameColumn('resource_type', 'target_type');
    table.renameColumn('resource_id', 'target_id');
    table.renameColumn('content', 'body');
  });

  const hasAuthorId = await knex.schema.hasColumn(TABLE, 'author_id');
  if (hasAuthorId) {
    await knex.schema.alterTable(TABLE, (table) => {
      table.renameColumn('author_id', 'author_user_id');
    });
  }

  await knex.schema.alterTable(TABLE, (table) => {
    table.text('display_name').nullable();
    table.text('display_avatar_url').nullable();
  });

  await knex.raw(`
    UPDATE "${TABLE}" c
    SET display_name = trim(concat(coalesce(u.first_name, ''), ' ', coalesce(u.last_name, '')))
    FROM "user" u
    WHERE c.author_user_id IS NOT NULL AND c.author_user_id = u.id
  `);

  await knex.raw(`
    UPDATE "${TABLE}"
    SET display_name = 'Unknown'
    WHERE display_name IS NULL OR btrim(display_name) = ''
  `);

  await knex.raw(`
    ALTER TABLE "${TABLE}"
    ALTER COLUMN display_name SET NOT NULL
  `);

  await knex.raw('DROP INDEX IF EXISTS comment_resource_type_resource_id_index');

  const hasauthorIdCol = await knex.schema.hasColumn(TABLE, 'author_user_id');

  await knex.schema.alterTable(TABLE, (table) => {
    table.timestamp('deleted_at', { useTz: true }).nullable();
    table.uuid('parent_comment_id').nullable().references('id').inTable(TABLE).onDelete('CASCADE');
    table.index(['target_type', 'target_id', 'created_at']);
    table.index(['parent_comment_id']);
    if (hasauthorIdCol) {
      table.index(['author_user_id']);
    }
  });

  await knex.raw(`
    ALTER TABLE "${TABLE}"
    ADD CONSTRAINT comment_target_type_check
    CHECK (target_type IN ('MEDIA_ITEM', 'ALBUM'))
  `);

  await knex.raw(`
    ALTER TABLE "${TABLE}"
    ADD CONSTRAINT comment_body_not_empty_check
    CHECK (char_length(body) > 0)
  `);
};

/**
 * Reverts only when `0001`-style audit columns are still present (so we do not undo `0009`'s table).
 */
export const down = async (knex: Knex): Promise<void> => {
  const hasCreatedBy = await knex.schema.hasColumn(TABLE, 'created_by');
  const hasTargetType = await knex.schema.hasColumn(TABLE, 'target_type');
  const hasResourceType = await knex.schema.hasColumn(TABLE, 'resource_type');

  if (!hasCreatedBy || !hasTargetType || hasResourceType) {
    return;
  }

  await knex.raw(`ALTER TABLE "${TABLE}" DROP CONSTRAINT IF EXISTS comment_target_type_check`);
  await knex.raw(`ALTER TABLE "${TABLE}" DROP CONSTRAINT IF EXISTS comment_body_not_empty_check`);

  await knex.schema.alterTable(TABLE, (table) => {
    table.dropForeign(['parent_comment_id']);
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.dropIndex(['target_type', 'target_id', 'created_at']);
    table.dropIndex(['author_user_id']);
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn('parent_comment_id');
    table.dropColumn('deleted_at');
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.dropColumn('display_avatar_url');
    table.dropColumn('display_name');
  });

  const hasauthorId = await knex.schema.hasColumn(TABLE, 'author_user_id');
  if (hasauthorId) {
    await knex.schema.alterTable(TABLE, (table) => {
      table.renameColumn('author_user_id', 'author_id');
    });
  }

  await knex.schema.alterTable(TABLE, (table) => {
    table.renameColumn('target_type', 'resource_type');
    table.renameColumn('target_id', 'resource_id');
    table.renameColumn('body', 'content');
  });

  await knex.schema.alterTable(TABLE, (table) => {
    table.index(['resource_type', 'resource_id']);
  });
};
