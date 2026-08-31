/**
 * GUARD: the media_processing_job enqueue must be ATOMIC with the media item's
 * PENDING→PROCESSING transition — one commit, one visibility event.
 *
 * The bug this pins: finalizeMediaItemUpload saved the item through the request UoW
 * but enqueued the job through a raw-Knex autocommit handle. The job row became
 * visible to the media-worker BEFORE the item's status committed; a hot worker
 * (250ms poll) claimed the job, read the item as still-PENDING, and rejected it
 * terminally — the upload hung in PENDING forever. The fix routes the enqueue
 * through uow.db() with .onConflict().ignore() as the one-active-job guard.
 *
 * Observation technique: the finalize call runs inside the same authenticated-WRITE
 * scope root the GraphQL mutation boundary uses, opened by hand through its generated
 * opener so the settlement stays under this test's control — the GraphQL boundary
 * itself can't be used because it finalizes before responding. Assertions read
 * through the plain `database` handle, which takes a DIFFERENT pooled connection than
 * the open trx, so READ COMMITTED shows exactly what the media-worker's connection
 * would see at that moment.
 */
import { randomUUID } from 'node:crypto';

import { MediaItemStatus } from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import {
  MINIMAL_PNG_1X1,
  seedIntegrationTestUploadedObject,
} from './integrationMediaObjectTestHelper';
import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID } from './testViewerIds';

const createMediaUploadMutation = `
  mutation {
    createMediaUpload(input: { kind: PHOTO, mimeType: "image/png" }) {
      data { mediaItemId }
      errors { code }
    }
  }
`;

type JobRow = { id: string; mediaItemId: string; status: string };

describe('media processing job enqueue boundary (integration)', () => {
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  let container: AwilixContainer<AppCradle>;
  let database: Knex;
  let integrationTestMediaStorage: IntegrationTestMediaStorage;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    database = container.resolve('database');
    integrationTestMediaStorage = setup.integrationTestMediaStorage;
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database, undefined, () => integrationTestMediaStorage.clear());
  });

  /** Create a PENDING item owned by the default viewer and seed its uploaded bytes. */
  const createSeededPendingItem = async (): Promise<string> => {
    const created = await executeGraphQL<{
      createMediaUpload: { data?: { mediaItemId: string }; errors: { code: string }[] };
    }>({ query: createMediaUploadMutation, context: { isLoggedIn: true } });
    expect(created.json.errors).toBeUndefined();
    expect(created.json.data?.createMediaUpload.errors).toEqual([]);
    const mediaItemId = created.json.data?.createMediaUpload.data?.mediaItemId;
    if (!mediaItemId) throw new Error('expected mediaItemId');

    await seedIntegrationTestUploadedObject(
      database,
      integrationTestMediaStorage,
      mediaItemId,
      MINIMAL_PNG_1X1,
    );
    return mediaItemId;
  };

  /** Outside-observer reads — plain pool connection, committed state only. */
  const jobRowsFor = (mediaItemId: string): Promise<JobRow[]> =>
    database('mediaProcessingJob').where({ mediaItemId }).select('id', 'mediaItemId', 'status');

  const itemStatus = async (mediaItemId: string): Promise<string | undefined> => {
    const row = await database('mediaItem').where({ id: mediaItemId }).first<{ status: string }>();
    return row?.status;
  };

  /**
   * Run finalize inside a manually-held write scope and hand control back between the
   * write and the settlement. There is nothing to start: the uow joins lazily on the
   * first repository call, and `finalize(ok)` is the scope root's one settlement call —
   * true commits, false rolls back. Settles on any failure so an open trx never leaks
   * into afterEach (TRUNCATE would block on it forever).
   */
  const finalizeInOpenUow = async (
    mediaItemId: string,
  ): Promise<{ finish: (act: 'commit' | 'rollback') => Promise<void> }> => {
    const { authenticatedWriteGraphQlContext: writeScope, dispose } = container.resolve(
      'openAuthenticatedWriteGraphQlContextScope',
    )({
      viewerId: TEST_VIEWER_1_ID,
    });
    let open = true;
    const finish = async (act: 'commit' | 'rollback'): Promise<void> => {
      open = false;
      try {
        await writeScope.finalize(act === 'commit');
      } finally {
        await dispose();
      }
    };
    try {
      const result = await writeScope.writeServices.finalizeMediaItemUpload({
        mediaItemId,
      });
      expect(result.success).toBe(true);
      return { finish };
    } catch (e) {
      if (open) await finish('rollback');
      throw e;
    }
  };

  describe('when finalize has run but its transaction is still open', () => {
    it('shows other connections neither the job row nor the status change, then both atomically at commit', async () => {
      const mediaItemId = await createSeededPendingItem();
      const { finish } = await finalizeInOpenUow(mediaItemId);
      try {
        // The worker's view mid-transaction: no claimable job row yet. Under the old
        // autocommit enqueue this row was already visible here — the exact race window.
        expect(await jobRowsFor(mediaItemId)).toHaveLength(0);

        // Self-check that the observer really is a separate connection: the item must
        // still read PENDING (the PROCESSING write is uncommitted). If this reads
        // PROCESSING, these queries are running THROUGH the open transaction and the
        // invisibility assertion above proved nothing — fail loudly, fix the harness.
        expect(await itemStatus(mediaItemId)).toBe(MediaItemStatus.pending.value);
      } catch (e) {
        await finish('rollback');
        throw e;
      }

      await finish('commit');

      // One commit made both facts visible together: a PENDING job the worker may now
      // claim, and a PROCESSING item that claim will find processable.
      const rows = await jobRowsFor(mediaItemId);
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe(MediaItemStatus.pending.value);
      expect(await itemStatus(mediaItemId)).toBe(MediaItemStatus.processing.value);
    });
  });

  describe('when the transaction rolls back after finalize', () => {
    it('leaves no orphaned job row and the item still PENDING', async () => {
      const mediaItemId = await createSeededPendingItem();
      const { finish } = await finalizeInOpenUow(mediaItemId);

      await finish('rollback');

      // Under the old autocommit enqueue the job row survived the rollback — an orphan
      // pointing at an item whose finalize never happened.
      expect(await jobRowsFor(mediaItemId)).toHaveLength(0);
      expect(await itemStatus(mediaItemId)).toBe(MediaItemStatus.pending.value);
    });
  });

  describe('when an active job already exists for the item (duplicate enqueue)', () => {
    it('commits the finalize anyway and keeps exactly one job row', async () => {
      const mediaItemId = await createSeededPendingItem();

      // Pre-existing active job. availableAt is in the future: the partial unique index
      // only predicates on status, so this row still triggers the conflict — but a live
      // media-worker cannot claim it (claim requires availableAt <= now), so a running
      // dev stack can't mutate it mid-test.
      const existingJobId = randomUUID();
      await database('mediaProcessingJob').insert({
        id: existingJobId,
        mediaItemId,
        status: MediaItemStatus.pending.value,
        attemptCount: 0,
        availableAt: new Date(Date.now() + 5 * 60_000),
        createdBy: TEST_VIEWER_1_ID,
        updatedBy: TEST_VIEWER_1_ID,
      });

      const { finish } = await finalizeInOpenUow(mediaItemId);
      await finish('commit');

      // THE guard for .onConflict().ignore(): if this reads PENDING after a commit that
      // reported success, that is the aborted-transaction silent-rollback signature —
      // a unique violation raised INSIDE the trx (i.e. the enqueue stopped using
      // ON CONFLICT DO NOTHING and swallowed the error instead) poisons the transaction
      // (25P02) and Postgres turns COMMIT into ROLLBACK without an error. It is NOT a
      // normal assertion miss; check enqueueIfNoneActive's conflict handling first.
      expect(await itemStatus(mediaItemId)).toBe(MediaItemStatus.processing.value);

      // The duplicate insert was ignored: the pre-existing job is still the only row.
      const rows = await jobRowsFor(mediaItemId);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(existingJobId);
    });
  });
});
