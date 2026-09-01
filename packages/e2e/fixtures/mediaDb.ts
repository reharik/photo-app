import { expect } from '@playwright/test';

import { getDb } from './db';

/**
 * Row-level assertions on the media-worker's output.
 *
 * The UI can only tell us that an item reached READY (the library grid filters on
 * it) and that a thumbnail object exists in S3 (the tile decodes). Neither says
 * anything about `media_asset`, and a completion transaction that rolled back
 * surfaces only as a 120s tile-poll timeout with no diagnostic. These read the
 * rows the worker actually writes.
 *
 * Deliberately narrow: one query per media item, no reusable query layer.
 *
 * Wire values below are `constantCase(key)` of the smart-enum members in
 * `packages/foundation/contracts/src/enums` — `mediaItemStatus.ts`
 * (MediaItemStatus, MediaJobStatus) and `graphqlSmartEnums.ts` (MediaKind,
 * MediaAssetKind). They are literals rather than an import because this package
 * deliberately depends on no `@packages/*` workspace: pulling contracts in to
 * read five strings would add a build edge and the smart-enum runtime to a test
 * runner that has neither today.
 */
const MEDIA_ITEM_STATUS_READY = 'READY';
const MEDIA_KIND_PHOTO = 'PHOTO';
const MEDIA_ASSET_KIND_DISPLAY = 'DISPLAY';
const MEDIA_ASSET_KIND_THUMBNAIL = 'THUMBNAIL';
/** A job the worker has not settled — it may still claim or re-claim it. */
const ACTIVE_JOB_STATUSES = ['PENDING', 'PROCESSING'];

type ProcessedMediaItemRow = {
  kind: string;
  status: string;
  width: number | null;
  height: number | null;
  activeJobCount: number;
  displayAssetCount: number;
  thumbnailAssetCount: number;
  displayWidth: number | null;
  displayHeight: number | null;
  displayMimeType: string | null;
  /**
   * `bigint` column: node-pg returns it as a string unless an int8 parser is
   * registered, and this connection registers none (unlike the apps, which run
   * `configurePostgresTypes`). Coerce before comparing.
   */
  displayFileSizeBytes: string | null;
};

/**
 * One query: the item's own processing state, the count of unsettled job rows,
 * the per-kind derivative counts, and the display asset's metadata.
 *
 * Builder identifiers are camelCase — `knex-stringcase` maps them to the physical
 * snake_case columns and maps the response back. The `raw` fragments bypass that
 * wrapping, so they carry PHYSICAL column names; their quoted camelCase aliases
 * survive the response conversion unchanged.
 */
const readProcessedMediaItem = async (
  mediaItemId: string,
): Promise<ProcessedMediaItemRow | undefined> => {
  const db = getDb();
  const row: ProcessedMediaItemRow | undefined = await db('mediaItem as mi')
    .leftJoin('mediaAsset as d', (join) => {
      join.on('d.mediaItemId', 'mi.id').andOnVal('d.kind', MEDIA_ASSET_KIND_DISPLAY);
    })
    .where('mi.id', mediaItemId)
    .first(
      'mi.kind',
      'mi.status',
      'mi.width',
      'mi.height',
      'd.width as displayWidth',
      'd.height as displayHeight',
      'd.mimeType as displayMimeType',
      'd.fileSizeBytes as displayFileSizeBytes',
      db.raw(
        `(select count(*) from media_processing_job j
            where j.media_item_id = mi.id and j.status in (?, ?))::int as "activeJobCount"`,
        ACTIVE_JOB_STATUSES,
      ),
      db.raw(
        `(select count(*) from media_asset a
            where a.media_item_id = mi.id and a.kind = ?)::int as "displayAssetCount"`,
        [MEDIA_ASSET_KIND_DISPLAY],
      ),
      db.raw(
        `(select count(*) from media_asset a
            where a.media_item_id = mi.id and a.kind = ?)::int as "thumbnailAssetCount"`,
        [MEDIA_ASSET_KIND_THUMBNAIL],
      ),
    );
  return row;
};

/**
 * Asserts the media-image pipeline finished and committed everything it writes.
 *
 * Read once, not polled: the caller has already seen the item in the library
 * grid, which filters on `status = READY`, and READY is written in the same
 * transaction as the asset rows — so the commit has happened by the time this
 * runs. Polling here would turn "the transaction rolled back" back into "this
 * was slow", which is the exact diagnostic collapse this assertion exists to
 * remove.
 *
 * Non-photo items are exempt from the derivative checks: `completeUploadedWithMetadata`
 * takes a video straight to READY with no display/thumbnail, so asserting them
 * would read as a broken pipeline the day a video fixture is added.
 */
export const expectMediaItemProcessed = async (mediaItemId: string): Promise<void> => {
  const row = await readProcessedMediaItem(mediaItemId);

  expect(row, `No media_item row for ${mediaItemId} — the upload never persisted.`).toBeDefined();
  if (row == null) {
    return;
  }

  const detail = `media item ${mediaItemId} — row: ${JSON.stringify(row)}`;

  expect(row.status, `Item did not reach READY. ${detail}`).toBe(MEDIA_ITEM_STATUS_READY);

  expect(
    row.activeJobCount,
    `A media_processing_job row is still PENDING/PROCESSING: the worker claimed the ` +
      `job but never settled it — the completion transaction did not commit. ${detail}`,
  ).toBe(0);

  if (row.kind !== MEDIA_KIND_PHOTO) {
    // Videos have no derivative pipeline; nothing further to assert.
    return;
  }

  expect(row.displayAssetCount, `Expected exactly one DISPLAY media_asset. ${detail}`).toBe(1);
  expect(row.thumbnailAssetCount, `Expected exactly one THUMBNAIL media_asset. ${detail}`).toBe(1);

  // Item dimensions are written from the display derivative's, so they must agree
  // exactly (sharp reports integers; applyProcessingResults only rounds).
  expect(row.width, `media_item.width is not set. ${detail}`).not.toBeNull();
  expect(row.height, `media_item.height is not set. ${detail}`).not.toBeNull();
  expect(row.width, `media_item.width does not match the display asset. ${detail}`).toBe(
    row.displayWidth,
  );
  expect(row.height, `media_item.height does not match the display asset. ${detail}`).toBe(
    row.displayHeight,
  );

  expect(
    row.displayMimeType ?? '',
    `Display asset has no mimeType — the derivative metadata was never applied. ${detail}`,
  ).not.toBe('');
  expect(
    Number(row.displayFileSizeBytes ?? 0),
    `Display asset fileSizeBytes is zero or unset. ${detail}`,
  ).toBeGreaterThan(0);
};

/**
 * Asserts a library delete actually removed the rows. The UI only shows the tile
 * disappearing, which a cache eviction or a status flip off READY also produces.
 *
 * `media_asset.media_item_id` is `ON DELETE CASCADE`, so a surviving asset row
 * means the cascade is broken — worth failing on independently.
 */
export const expectMediaItemFullyDeleted = async (mediaItemId: string): Promise<void> => {
  const db = getDb();
  const rows: { mediaItemCount: number; mediaAssetCount: number }[] = await db.select(
    db.raw(`(select count(*) from media_item where id = ?)::int as "mediaItemCount"`, [
      mediaItemId,
    ]),
    db.raw(`(select count(*) from media_asset where media_item_id = ?)::int as "mediaAssetCount"`, [
      mediaItemId,
    ]),
  );
  const row = rows[0];

  expect(row.mediaItemCount, `media_item row for ${mediaItemId} still exists after delete.`).toBe(
    0,
  );
  expect(
    row.mediaAssetCount,
    `media_asset rows for ${mediaItemId} survived the delete — the cascade did not fire.`,
  ).toBe(0);
};
