/**
 * GUARD: the guest-invite send sweep skips a queued row whose authorization no longer
 * exists instead of throwing. Before the strategy fix this was a TypeError that aborted
 * the whole pass, taking every other queued notification down with it. Observable
 * outcomes: the pass completes, the healthy row still sends, both rows are cleaned up.
 *
 * Moved here from apps/api's revokeAndReshare suite (scenario D) — the sweep is worker
 * code. The arrange is by direct insert (guest users, album + item, PENDING access_grant
 * rows with link tokens, async_notification rows) instead of driving api mutations and
 * the post-commit event bus: that bus writing these async_notification rows is pinned by
 * revokeAndReshare scenario B on the api side; this suite's subject is the sweep's
 * behavior once the rows exist.
 */
import { jest } from '@jest/globals';
import { AsyncNotificationKind, EntityType, ok, Operation } from '@packages/contracts';
import type { NotificationService } from '@packages/notifications';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

import type { Config as WorkerConfig } from '../config.js';
import { createWorkerContainer } from '../container.js';
import type { AppCradle } from '../generated/ioc-composed.js';
import { build__FastSweepNotification } from '../tasks/schedule/individualNotification/fastSweepNotification.js';
import { build__AlbumSharedWithNonUserStrategy } from '../tasks/schedule/individualNotification/fastSweepNotificationStrategies/albumSharedWithNonUserStrategy.js';
import { ensureTestViewerUsers } from './ensureTestViewerUsers';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID } from './testViewerIds';

const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60_000);

describe('fast sweep — orphaned authorization (integration)', () => {
  let container: AwilixContainer<AppCradle>;
  let database: Knex;

  beforeAll(async () => {
    container = createWorkerContainer();
    database = container.resolve('database');
    await ensureTestViewerUsers(database);
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database);
  });

  afterAll(async () => {
    // The container is a plain factory now, with no module-global to tear down —
    // what still has to be released is the knex pool, or jest hangs on the open
    // handle.
    await database.destroy();
  });

  const createFakeLogger = () => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
  });

  // ---- direct-insert arrange helpers (mirror what the api's share mutation persists) ----

  /** A guest the sharer invited: a PENDING user row, exactly as the share flow mints it. */
  const insertGuestUser = async (email: string): Promise<string> => {
    const id = randomUUID();
    await database('user').insert({
      id,
      email,
      firstName: 'Guest',
      lastName: 'Pending',
      userStatus: 'PENDING',
      emailVerified: false,
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
    return id;
  };

  /** The send strategy refuses empty albums, so the album gets one READY item. */
  const insertAlbumWithOneItem = async (title: string): Promise<string> => {
    const albumId = randomUUID();
    await database('album').insert({
      id: albumId,
      title,
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
    const mediaItemId = randomUUID();
    await database('mediaItem').insert({
      id: mediaItemId,
      ownerId: TEST_VIEWER_1_ID,
      kind: 'PHOTO',
      mimeType: 'image/png',
      sizeBytes: 67,
      status: 'READY',
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
    await database('albumItem').insert({
      id: randomUUID(),
      albumId,
      mediaItemId,
      orderIndex: 0,
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
    return albumId;
  };

  /** A live pending invite: kind PENDING = grantedToUser AND linkToken both set. */
  const insertPendingInvite = async (
    albumId: string,
    guestId: string,
  ): Promise<{ id: string; linkToken: string }> => {
    const id = randomUUID();
    const linkToken = randomUUID();
    await database('accessGrant').insert({
      id,
      albumId,
      grantedToUser: guestId,
      grantedBy: TEST_VIEWER_1_ID,
      // The guest-invite default set (PendingUserAuthorization.create); revived via the
      // Operation enum on read, so the wire values must be real members.
      operations: [Operation.download.value, Operation.comment.value],
      kind: 'PENDING',
      origin: 'OWNER',
      linkToken,
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
    return { id, linkToken };
  };

  /**
   * The queued row the dispatcher's asyncWriter would have written for the invite.
   * dirtySince is backdated so the claim predicate (`dirtySince < now() - window`)
   * matches even for a non-zero debounce window.
   */
  const insertQueuedInviteNotification = async (
    albumId: string,
    guestId: string,
    authorizationId: string,
  ): Promise<void> => {
    await database('asyncNotification').insert({
      id: randomUUID(),
      channel: 'email',
      kind: AsyncNotificationKind.guestAlbumShared.value,
      recipientId: guestId,
      actorId: TEST_VIEWER_1_ID,
      containerType: EntityType.album.value,
      containerId: albumId,
      subjectType: EntityType.authorization.value,
      subjectId: authorizationId,
      dirtySince: minutesAgo(5),
      attempts: 0,
    });
  };

  it('skips + cleans the orphaned row and still sends the healthy one in the same claim', async () => {
    const guest1 = `guest1-${randomUUID()}@example.test`;
    const guest2 = `guest2-${randomUUID()}@example.test`;

    const albumId = await insertAlbumWithOneItem('sweep-survives-orphan');
    const guest1Id = await insertGuestUser(guest1);
    const guest2Id = await insertGuestUser(guest2);
    const invite1 = await insertPendingInvite(albumId, guest1Id);
    const invite2 = await insertPendingInvite(albumId, guest2Id);
    await insertQueuedInviteNotification(albumId, guest1Id, invite1.id);
    await insertQueuedInviteNotification(albumId, guest2Id, invite2.id);
    expect(
      await database('asyncNotification').whereIn('subjectId', [invite1.id, invite2.id]),
    ).toHaveLength(2);

    // Orphan guest2's queued row: its authorization vanishes (out-of-band delete —
    // the row-gone case the strategy must survive; a cascade from an album delete
    // produces the same state).
    await database('accessGrant').where({ id: invite2.id }).delete();

    const notify = jest.fn<NotificationService['notify']>(async () => ok('sent-id'));
    const logger = createFakeLogger();
    const workerConfig = {
      clientUrl: 'http://sweep.test',
      debounceEmailWindowSeconds: 0,
    } as WorkerConfig;
    const sweep = build__FastSweepNotification({
      logger,
      notificationService: { notify },
      systemAsyncNotificationRepository: container.resolve('systemAsyncNotificationRepository'),
      systemUserRepository: container.resolve('systemUserRepository'),
      config: workerConfig,
      fastSweepNotificationStrategies: [
        build__AlbumSharedWithNonUserStrategy({
          config: workerConfig,
          systemAlbumRepository: container.resolve('systemAlbumRepository'),
          systemAuthorizationRepository: container.resolve('systemAuthorizationRepository'),
          logger,
        }),
      ],
    });

    // Before the strategy fix this pass threw (TypeError on the missing row) and
    // NOTHING in the claim was sent or cleaned up.
    const outcome = await sweep();
    expect(outcome).toBe('processed');

    // The healthy row sent — with guest1's live invite link.
    expect(notify).toHaveBeenCalledTimes(1);
    const payload = notify.mock.calls[0][0];
    expect(payload.to).toBe(guest1);
    expect(payload.template).toBe('guestAlbumShared');
    const data = payload.data as { inviteUrl: string };
    expect(data.inviteUrl).toBe(`http://sweep.test/shared/${invite1.linkToken}`);

    // Both rows are gone from the queue: sent → deleted, skipped → deleted.
    expect(
      await database('asyncNotification').whereIn('subjectId', [invite1.id, invite2.id]),
    ).toHaveLength(0);
  });
});
