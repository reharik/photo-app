import type { Knex } from 'knex';

/**
 * Add the media kind to the processing-job row: `media_processing_job.media_kind`.
 *
 * string(32), NOT NULL, default 'PHOTO' — the constant-case MediaKind wire value,
 * matching `media_item.kind` (0001), which is the only other place a MediaKind is
 * stored. Same length, same plain-string shape, no CHECK constraint.
 *
 * The default fills every existing row as the column is added, so there is no separate
 * backfill and no nullable interim state. It is accurate rather than merely convenient:
 * at the time this migration runs, the sole enqueue path (finalizeMediaItemUpload) is
 * still gated on MediaKind.photo, so every job row that predates the column — PENDING or
 * otherwise — really is a photo. That gate is removed in the same change that starts
 * populating this column, which is why the reasoning is stated in the past tense: it
 * justifies the historical rows, not the ones written from then on.
 *
 * Why the job row needs it: nothing could tell which pipeline a claimed job belonged to
 * without loading the media item, which the worker only does after the claim. The job
 * row should describe the work it represents. The column lands first so the selection
 * has something to read; `processNextMediaImageJob` now branches on it
 * (`job.mediaKind.equals(MediaKind.video)`) to choose the video or image pipeline, and
 * triage no longer inspects the item's kind at all.
 *
 * Named `media_kind`, not `kind`: the table already has `status`, which is the *job's*
 * status, and a bare `kind` beside it would read as the job's kind rather than the
 * item's.
 *
 * Not registered in enumConstraintDrift.integration.tests.ts: that guard scans CHECK
 * constraints and index predicates, and a column default is neither. The 'PHOTO'
 * literal here is therefore unguarded against a future MediaKind rename — the same
 * exposure `media_item.kind` has carried since 0001.
 *
 * No import from @packages/contracts — the 'PHOTO' literal is hand-typed on purpose:
 * migrations are compiled by plain `tsc` (tsconfig.db.json) and their imports survive
 * as live runtime specifiers, while the prod image never copies `packages/`. See 0031's
 * closing note for the full mechanics.
 */

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('media_processing_job', (table) => {
    // which pipeline this job's work belongs to; MediaKind wire value
    table.string('media_kind', 32).notNullable().defaultTo('PHOTO');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('media_processing_job', (table) => {
    table.dropColumn('media_kind');
  });
}
