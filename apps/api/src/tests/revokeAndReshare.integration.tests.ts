/**
 * End-to-end coverage for the revoked-authorization / re-share fixes, none of which had
 * tests while the primary bug was live in production:
 *
 *  A1. revoke → re-share to an ACTIVE user. The new USER grant INSERT used to violate
 *      access_grant_album_membership_unique because the 0024 predicate (kind = 'USER')
 *      kept revoked rows inside the index. Migration 0028 adds `revoked_at IS NULL`;
 *      this is the flow it unblocks.
 *  A2. guest lifecycle: invite → revoke the pending invite → re-invite (fresh token) →
 *      accept. Exercises activatePendingUserAuthorization (PENDING → USER + PUBLIC
 *      conversion) with revoked rows present in the table.
 *  A3. the media-item twin of 0028 at the DDL level. App flows can no longer produce
 *      media-item-scoped grants (loose items are wrapped in shadow albums), so the
 *      index is exercised by direct inserts: revoked + live may coexist, two live rows
 *      may not.
 *  B.  re-sharing an album with an already-pending user re-emits albumSharedWithPendingUser.
 *      Before the Album.ts fix the event only fired on new-authorization creation, so a
 *      re-invite wrote nothing and no email was ever queued. Observable outcome: a fresh
 *      async_notification row keyed to the SAME authorization.
 *  C.  a revoked pending grant is invisible to getPendingUserAuthorizationById (returns
 *      undefined; the row itself survives — it's the revoked_at filter, not a delete).
 *      This is the dead-invite-link fix: the send strategy puts linkToken in the email
 *      body, so a revoked grant leaking through here would mail a dead link.
 *  (D — the guest-invite send sweep surviving a row whose authorization is gone — is
 *  worker behavior and lives in apps/media-worker/src/tests/
 *  fastSweepOrphanedAuthorization.integration.tests.ts. Scenario B here still pins that
 *  the api-side event bus produces the async_notification rows that sweep consumes.)
 *
 * Harness: the shared GraphQL integration setup (real Postgres, real container, real
 * post-commit event bus — async_notification rows are written by the dispatcher and are
 * assertable because the worker sweep does not run here). Accept in A2 mirrors the
 * controller's AuthService scope-root opener, same as authPasswordReset.integration.tests.ts.
 */
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';
import { DateTime } from 'luxon';
import assert from 'node:assert';
import { createHash, randomUUID } from 'node:crypto';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID, TEST_VIEWER_A_ID } from './testViewerIds';

const VIEWER_A_EMAIL = 'test-viewer-a@example.test';
const VALID_CODE = '654321';
const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

const createAlbumMutation = `
  mutation CreateAlbum($input: CreateAlbumInput!) {
    createAlbum(input: $input) {
      data { albumId }
      errors { code }
    }
  }
`;

const grantForAlbumMutation = `
  mutation Grant($input: GrantUserAuthorizationForAlbumInput!) {
    grantUserAuthorizationForAlbum(input: $input) {
      data {
        succeeded { email }
        failed { email error { code } }
      }
      errors { code }
    }
  }
`;

const revokeShareMutation = `
  mutation Revoke($input: RevokeShareAuthenticationInput!) {
    RevokeShareAuthentication(input: $input) {
      data { albumId }
      errors { code }
    }
  }
`;

type CreateAlbumResponse = {
  createAlbum: { data?: { albumId: string }; errors?: { code: string }[] | null };
};
type GrantResponse = {
  grantUserAuthorizationForAlbum: {
    data?: {
      succeeded: { email: string }[];
      failed: { email: string; error: { code: string } }[];
    };
    errors?: { code: string }[] | null;
  };
};
type RevokeResponse = {
  RevokeShareAuthentication: { data?: { albumId: string }; errors?: { code: string }[] | null };
};

type GrantRow = {
  id: string;
  kind: string;
  grantedToUser?: string;
  linkToken?: string;
  revokedAt?: Date;
};

describe('revoked authorizations and re-sharing (integration)', () => {
  let container: AwilixContainer<AppCradle>;
  let database: Knex;
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    database = container.resolve('database');
    // No handler wiring step any more: the publisher injects the domainEventHandlers
    // group and builds its dispatch map itself, so any container that can resolve an
    // eventPublisher already has the post-commit bus. B asserts on async_notification
    // rows written by that bus.
  });

  afterEach(async () => {
    // Reads join the request transaction now, so a repository resolved straight off
    // the container leaves one open — there is no GraphQL boundary here to settle it,
    // and TRUNCATE below would block on the lock forever. settle(false) is a no-op
    // when nothing is open, which is the case for the tests that go through yoga.
    await container.resolve('uow').settle(false);
    await resetIntegrationTestDb(database);
  });

  // ---- helpers (all GraphQL calls run as the default seeded viewer, TEST_VIEWER_1) ----

  const loggedIn = { isLoggedIn: true as const };

  const createAlbum = async (title: string): Promise<string> => {
    const res = await executeGraphQL<CreateAlbumResponse>({
      query: createAlbumMutation,
      variables: { input: { title } },
      context: loggedIn,
    });
    expect(res.json.errors).toBeUndefined();
    const albumId = res.json.data?.createAlbum.data?.albumId;
    expect(albumId).toBeTruthy();
    if (!albumId) throw new Error('expected albumId');
    return albumId;
  };

  const shareAlbum = async (albumId: string, emails: string[]): Promise<void> => {
    const res = await executeGraphQL<GrantResponse>({
      query: grantForAlbumMutation,
      variables: { input: { albumId, grantedToHandles: emails } },
      context: loggedIn,
    });
    expect(res.json.errors).toBeUndefined();
    expect(res.json.data?.grantUserAuthorizationForAlbum.errors ?? []).toEqual([]);
    expect(res.json.data?.grantUserAuthorizationForAlbum.data?.failed).toEqual([]);
    expect(
      (res.json.data?.grantUserAuthorizationForAlbum.data?.succeeded ?? []).map((x) => x.email),
    ).toEqual(expect.arrayContaining(emails));
  };

  const revokeShare = async (albumId: string, authorizationId: string): Promise<void> => {
    const res = await executeGraphQL<RevokeResponse>({
      query: revokeShareMutation,
      variables: { input: { albumId, authorizationId } },
      context: loggedIn,
    });
    expect(res.json.errors).toBeUndefined();
    expect(res.json.data?.RevokeShareAuthentication.errors ?? []).toEqual([]);
  };

  const grantRowsFor = (albumId: string, grantedToUser: string): Promise<GrantRow[]> =>
    database('accessGrant')
      .where({ albumId, grantedToUser })
      .orderBy('createdAt', 'asc')
      .select<GrantRow[]>(['id', 'kind', 'grantedToUser', 'linkToken', 'revokedAt']);

  const userIdByEmail = async (email: string): Promise<string> => {
    const row = await database('user').where({ email }).first<{ id: string }>('id');
    expect(row).toBeDefined();
    return row.id;
  };

  describe('A1 — revoke → re-share to an active user (the 0028 regression)', () => {
    it('inserts a fresh live USER grant next to the revoked one', async () => {
      const albumId = await createAlbum('revoke-reshare-active');

      await shareAlbum(albumId, [VIEWER_A_EMAIL]);
      const [first] = await grantRowsFor(albumId, TEST_VIEWER_A_ID);
      expect(first.kind).toBe('USER');
      expect(first.revokedAt).toBeUndefined();

      await revokeShare(albumId, first.id);
      const [revoked] = await grantRowsFor(albumId, TEST_VIEWER_A_ID);
      expect(revoked.id).toBe(first.id);
      expect(revoked.revokedAt).toBeInstanceOf(Date);

      // Pre-0028 this INSERT collided with the revoked row still occupying
      // access_grant_album_membership_unique and the whole mutation rolled back.
      await shareAlbum(albumId, [VIEWER_A_EMAIL]);

      const rows = await grantRowsFor(albumId, TEST_VIEWER_A_ID);
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.kind)).toEqual(['USER', 'USER']);
      const stillRevoked = rows.find((r) => r.id === first.id);
      const fresh = rows.find((r) => r.id !== first.id);
      assert(stillRevoked && fresh);
      // The revoked row survives untouched (soft delete is history, not resurrection)…
      expect(stillRevoked.revokedAt).toBeInstanceOf(Date);
      // …and the replacement is a brand-new live grant, not an un-revoke.
      expect(fresh.revokedAt).toBeUndefined();
    });
  });

  describe('A2 — guest lifecycle: invite → revoke → re-invite → accept', () => {
    it('issues a fresh token on re-invite and converts cleanly with revoked rows present', async () => {
      const guestEmail = `guest-${randomUUID()}@example.test`;
      const albumId = await createAlbum('revoke-reinvite-accept');

      await shareAlbum(albumId, [guestEmail]);
      const guestId = await userIdByEmail(guestEmail);
      const [invite1] = await grantRowsFor(albumId, guestId);
      expect(invite1.kind).toBe('PENDING');
      expect(invite1.linkToken).toBeTruthy();

      await revokeShare(albumId, invite1.id);

      await shareAlbum(albumId, [guestEmail]);
      const afterReinvite = await grantRowsFor(albumId, guestId);
      expect(afterReinvite).toHaveLength(2);
      const invite2 = afterReinvite.find((r) => r.id !== invite1.id);
      assert(invite2);
      expect(invite2.kind).toBe('PENDING');
      expect(invite2.revokedAt).toBeUndefined();
      // The dead invite's token is never reused — the re-invite mints a new one, so the
      // old emailed link stays dead (token resolution filters revoked_at).
      expect(invite2.linkToken).toBeTruthy();
      expect(invite2.linkToken).not.toBe(invite1.linkToken);

      // Accept: the same AuthService scope-root opener the auth controller drives.
      await database('emailVerification').insert({
        id: randomUUID(),
        email: guestEmail,
        codeHash: sha256(VALID_CODE),
        expiresAt: DateTime.now().plus({ minutes: 10 }).toISO(),
        consumedAt: null,
        attemptCount: 0,
      });
      // The service commits itself on success and returns without settling on every
      // failure path, so the bracket settles like the controller does — a rollback that
      // is inert once the commit has happened.
      const { authService, dispose } = container.resolve('openAuthServiceScope')();
      try {
        const result = await authService.verifyCodeAndSetPassword({
          email: guestEmail,
          password: 'newPassword9',
          code: VALID_CODE,
          firstName: 'Guest',
          lastName: 'Accepted',
          smsOptIn: false,
        });
        expect(result.success).toBe(true);
      } finally {
        await authService.settle(false);
        await dispose();
      }

      const userRow = await database('user')
        .where({ id: guestId })
        .first<{ userStatus: string }>('userStatus');
      expect(userRow.userStatus).toBe('ACTIVE');

      // Conversion splits the live PENDING row: a NEW USER grant is inserted and the
      // pending row itself is reused as the PUBLIC link (same id). The revoked invite
      // stays behind as history and must not block any of it.
      const finalRows = await database('accessGrant')
        .where({ albumId })
        .select<GrantRow[]>(['id', 'kind', 'grantedToUser', 'linkToken', 'revokedAt']);

      const revokedInvite = finalRows.find((r) => r.id === invite1.id);
      assert(revokedInvite);
      expect(revokedInvite.kind).toBe('PENDING');
      expect(revokedInvite.revokedAt).toBeInstanceOf(Date);

      const publicLink = finalRows.find((r) => r.id === invite2.id);
      assert(publicLink);
      expect(publicLink.kind).toBe('PUBLIC');
      expect(publicLink.grantedToUser).toBeUndefined();

      const userGrant = finalRows.find((r) => r.kind === 'USER' && r.grantedToUser === guestId);
      assert(userGrant);
      expect(userGrant.revokedAt).toBeUndefined();
    });
  });

  describe('A3 — media-item membership unique excludes revoked rows (DDL level)', () => {
    // Grants are album-scoped in every current app flow (loose items get shadow albums),
    // so access_grant_media_item_membership_unique can only be exercised directly. Same
    // 0028 predicate change, same exposure: revoked + live must coexist, two live must not.
    const insertMediaGrant = async (
      mediaItemId: string,
      grantedToUser: string,
      revokedAt: Date | null,
    ): Promise<void> => {
      await database('accessGrant').insert({
        id: randomUUID(),
        mediaItemId,
        grantedToUser,
        grantedBy: TEST_VIEWER_1_ID,
        operations: ['VIEW'],
        kind: 'USER',
        origin: 'OWNER',
        revokedAt,
        createdBy: TEST_VIEWER_1_ID,
        updatedBy: TEST_VIEWER_1_ID,
      });
    };

    it('allows a live row next to a revoked one but still rejects two live rows', async () => {
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

      await insertMediaGrant(mediaItemId, TEST_VIEWER_A_ID, new Date());
      // Pre-0028: unique violation right here.
      await insertMediaGrant(mediaItemId, TEST_VIEWER_A_ID, null);

      // The index still enforces one LIVE membership per (item, user).
      await expect(insertMediaGrant(mediaItemId, TEST_VIEWER_A_ID, null)).rejects.toMatchObject({
        code: '23505',
      });
    });
  });

  describe('B — re-share with an existing pending user re-emits the event', () => {
    it('queues a fresh async_notification for the SAME pending authorization', async () => {
      const guestEmail = `guest-${randomUUID()}@example.test`;
      const albumId = await createAlbum('reshare-pending-reemit');

      await shareAlbum(albumId, [guestEmail]);
      const guestId = await userIdByEmail(guestEmail);
      const [invite] = await grantRowsFor(albumId, guestId);
      expect(invite.kind).toBe('PENDING');

      // The first share queued the invite email (post-commit event → dispatcher →
      // asyncWriter). Simulate the sweep having sent it: rows are deleted on send.
      const firstQueued = await database('asyncNotification').where({ subjectId: invite.id });
      expect(firstQueued).toHaveLength(1);
      expect(firstQueued[0].kind).toBe('GUEST_ALBUM_SHARED');
      expect(firstQueued[0].recipientId).toBe(guestId);
      await database('asyncNotification').where({ subjectId: invite.id }).delete();

      // Re-share: same album, same still-pending user. Before the fix the aggregate hit
      // the existing-authorization branch and recorded nothing, so this row never appeared
      // and the re-invite silently sent no email.
      await shareAlbum(albumId, [guestEmail]);

      const requeued = await database('asyncNotification').where({ subjectId: invite.id });
      expect(requeued).toHaveLength(1);
      expect(requeued[0].kind).toBe('GUEST_ALBUM_SHARED');
      expect(requeued[0].recipientId).toBe(guestId);

      // And no duplicate authorization was minted — the re-invite reuses the live one.
      const grants = await grantRowsFor(albumId, guestId);
      expect(grants).toHaveLength(1);
      expect(grants[0].id).toBe(invite.id);
    });
  });

  describe('C — revoked pending grant is not returned by getPendingUserAuthorizationById', () => {
    it('returns undefined after revocation while the row itself survives', async () => {
      const guestEmail = `guest-${randomUUID()}@example.test`;
      const albumId = await createAlbum('revoked-invite-invisible');

      await shareAlbum(albumId, [guestEmail]);
      const guestId = await userIdByEmail(guestEmail);
      const [invite] = await grantRowsFor(albumId, guestId);
      expect(invite.kind).toBe('PENDING');

      const systemAuthorizationRepository = container.resolve('systemAuthorizationRepository');

      // Live invite: the lookup the send strategy uses resolves it, token and all.
      const beforeRevoke = await systemAuthorizationRepository.getPendingUserAuthorizationById(
        invite.id,
      );
      expect(beforeRevoke?.linkToken).toBe(invite.linkToken);

      await revokeShare(albumId, invite.id);

      // Revoked: invisible to the lookup, so the sweep can never put this dead token in
      // an email…
      expect(
        await systemAuthorizationRepository.getPendingUserAuthorizationById(invite.id),
      ).toBeUndefined();

      // …even though the soft-deleted row is still in the table.
      const row = await database('accessGrant').where({ id: invite.id }).first<GrantRow>();
      expect(row).toBeDefined();
      expect(row.revokedAt).toBeInstanceOf(Date);
    });
  });
});
