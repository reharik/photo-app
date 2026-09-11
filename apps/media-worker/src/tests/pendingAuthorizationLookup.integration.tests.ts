/**
 * `getPendingUserAuthorizationById` — the lookup the guest-invite send strategy
 * uses to fetch an invite's linkToken before mailing it.
 *
 * Moved here from apps/api's revokeAndReshare suite (scenario C), for the same
 * reason scenario D moved: this is worker code. The method exists ONLY on
 * worker-core's `SystemAuthorizationRepository` — its sole production consumer
 * is albumSharedWithNonUserStrategy in this app — and media-core's copy of that
 * interface deliberately does not declare it. Resolving it off the api's
 * container (which composes media-core) was what made `nx run api:typecheck`
 * fail; the worker container composes worker-core, so the method is there.
 *
 * What it guards: the send strategy puts `linkToken` straight into the email
 * body. A revoked grant leaking through this lookup would mail a dead invite
 * link. The filter is `revoked_at IS NULL` — a revoked row is invisible to the
 * lookup but still present in the table, and both halves are asserted, because
 * "returns undefined" alone would also pass if the row had been deleted.
 *
 * Arrange is by direct insert rather than by driving api mutations, matching
 * fastSweepOrphanedAuthorization.integration.tests.ts. That the api's share and
 * revoke mutations produce these rows is pinned on the api side; this suite's
 * subject is what the lookup does once they exist.
 */
import { AuthorizationKind, Operation } from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

import { createWorkerContainer } from '../container.js';
import type { AppCradle } from '../generated/ioc-composed.js';
import { ensureTestViewerUsers } from './ensureTestViewerUsers';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID } from './testViewerIds';

type GrantRow = { id: string; linkToken?: string; revokedAt?: Date };

describe('getPendingUserAuthorizationById (integration)', () => {
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
    await database.destroy();
  });

  /**
   * The repository reads through `uow.db()`, which throws outside a boundary, so
   * a test that resolves it straight off the container has to supply one — the
   * same way the task that owns this lookup in production does. `inTransaction`
   * closes it on both paths, which matters here beyond tidiness: an open
   * transaction would block resetDb's TRUNCATE in `afterEach` forever.
   */
  const lookup = async (id: string) => {
    const systemAuthorizationRepository = container.resolve('systemAuthorizationRepository');
    const uow = container.resolve('uow');
    return uow.inTransaction(() =>
      systemAuthorizationRepository.getPendingUserAuthorizationById(id),
    );
  };

  /** A guest the sharer invited: a PENDING user row, as the share flow mints it. */
  const insertGuestUser = async (): Promise<string> => {
    const id = randomUUID();
    await database('user').insert({
      id,
      email: `guest-${randomUUID()}@example.test`,
      firstName: 'Guest',
      lastName: 'Pending',
      userStatus: 'PENDING',
      emailVerified: false,
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
    return id;
  };

  const insertAlbum = async (title: string): Promise<string> => {
    const albumId = randomUUID();
    await database('album').insert({
      id: albumId,
      title,
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
      // The guest-invite default set (PendingUserAuthorization.create); revived via
      // the Operation enum on read, so the wire values must be real members.
      operations: [Operation.download.value, Operation.comment.value],
      kind: 'PENDING',
      origin: 'OWNER',
      linkToken,
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
    return { id, linkToken };
  };

  describe('When the pending invite is live', () => {
    it('resolves it, token and all — this is what the send strategy mails', async () => {
      const albumId = await insertAlbum('live-invite');
      const guestId = await insertGuestUser();
      const invite = await insertPendingInvite(albumId, guestId);

      const found = await lookup(invite.id);

      expect(found?.id).toBe(invite.id);
      expect(found?.linkToken).toBe(invite.linkToken);
      expect(found?.kind.value).toBe(AuthorizationKind.pending.value);
      expect(found?.grantedToUser).toBe(guestId);
    });
  });

  describe('When the pending invite has been revoked', () => {
    it('returns undefined while the row itself survives', async () => {
      const albumId = await insertAlbum('revoked-invite-invisible');
      const guestId = await insertGuestUser();
      const invite = await insertPendingInvite(albumId, guestId);
      // Live first, so an always-undefined lookup cannot pass this test.
      expect((await lookup(invite.id))?.linkToken).toBe(invite.linkToken);

      // What the revoke mutation persists: a soft delete, not a row delete.
      await database('accessGrant').where({ id: invite.id }).update({ revokedAt: new Date() });

      // Invisible to the lookup, so the sweep can never put this dead token in an email…
      expect(await lookup(invite.id)).toBeUndefined();

      // …even though the soft-deleted row is still in the table. Without this half,
      // a hard delete would satisfy the assertion above just as well.
      const row = await database('accessGrant').where({ id: invite.id }).first<GrantRow>();
      expect(row).toBeDefined();
      expect(row.revokedAt).toBeInstanceOf(Date);
    });
  });

  describe('When the invite has expired', () => {
    it('returns undefined — the live filter covers expiry as well as revocation', async () => {
      const albumId = await insertAlbum('expired-invite');
      const guestId = await insertGuestUser();
      const invite = await insertPendingInvite(albumId, guestId);

      await database('accessGrant')
        .where({ id: invite.id })
        .update({ expiresAt: new Date(Date.now() - 60_000) });

      expect(await lookup(invite.id)).toBeUndefined();
    });
  });

  describe('When the id belongs to a grant of another kind', () => {
    it('throws rather than returning a row the caller would treat as an invite', async () => {
      // Selecting by id alone can return any of the three kinds. A USER grant has
      // no linkToken, so quietly handing it back would mail `undefined` as the
      // invite URL instead of failing loudly.
      const albumId = await insertAlbum('user-grant');
      const guestId = await insertGuestUser();
      const id = randomUUID();
      await database('accessGrant').insert({
        id,
        albumId,
        grantedToUser: guestId,
        grantedBy: TEST_VIEWER_1_ID,
        operations: [Operation.download.value],
        kind: 'USER',
        origin: 'OWNER',
        createdBy: TEST_VIEWER_1_ID,
        updatedBy: TEST_VIEWER_1_ID,
      });

      await expect(lookup(id)).rejects.toThrow(/expected PENDING/);
    });
  });
});
