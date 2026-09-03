/**
 * Integration coverage for `Album.emailShares.delivery` — the email-delivery state
 * surfaced on the share modal's roster.
 *
 * The originating bug: a share invite never arrived and the owner had no way to tell
 * whether it was sent, bounced, or lost. The roster now carries the latest
 * email_delivery for each access_grant, collapsed to three states.
 *
 * Two seams are worth the harness cost, and neither is visible from a unit test:
 *
 * 1. THE REVIVAL SEAM (the dangerous one). The delivery status arrives through a
 *    DISTINCT ON subquery aliased as `latest_delivery.status as delivery_status`, so
 *    it crosses raw SQL, knex-stringcase's identifier wrapping, its camelCase
 *    post-processing, and finally withEnumRevival. Miss the revival entry and the row
 *    carries a bare 'DELIVERY' string whose `.state` is undefined — no throw, no type
 *    error, just every roster row silently reporting no delivery. This repo has had
 *    exactly that bug before with a mangled alias, which is why the assertions below
 *    are on a row that HAS a status, not merely on the query running: an empty result
 *    and an un-revived result look identical.
 *
 * 2. THE COLLAPSE. EmailStatus (hand-authored, six members) maps to EmailDeliveryState
 *    (generated from the SDL, three members) through the one Record in
 *    viewerAuthorizationsReadService. The client must never learn BOUNCE_TRANSIENT
 *    exists, so that case is asserted from the outside — through GraphQL — where a leak
 *    would be observable.
 *
 * email_delivery rows are inserted directly. The SES consumer that writes them is
 * worker-side and does not run here; this test is about the read path.
 *
 * Members are deliberately NOT covered: a member necessarily received and acted on an
 * invite already, so their delivery status is settled by construction. `emailShares`
 * excludes grantees who are album members and this test does not change that.
 */
import { EmailKind, EmailStatus } from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID } from './testViewerIds';

const VIEWER_A_EMAIL = 'test-viewer-a@example.test';

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
      data { succeeded { email } failed { email error { code } } }
      errors { code }
    }
  }
`;

const rosterQuery = `
  query Roster($albumId: ID!) {
    viewer {
      id
      album(id: $albumId) {
        id
        emailShares {
          id
          email
          delivery { state at }
        }
      }
    }
  }
`;

type CreateAlbumResponse = {
  createAlbum: { data?: { albumId: string }; errors?: { code: string }[] | null };
};
type GrantResponse = {
  grantUserAuthorizationForAlbum: {
    data?: { succeeded: { email: string }[]; failed: { email: string }[] };
    errors?: { code: string }[] | null;
  };
};
type RosterResponse = {
  viewer?: {
    album?: {
      emailShares: {
        id: string;
        email: string;
        delivery?: { state: string; at: string } | null;
      }[];
    } | null;
  } | null;
};

describe('share roster email delivery status (integration)', () => {
  let container: AwilixContainer<AppCradle>;
  let database: Knex;
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    database = container.resolve('database');
  });

  afterEach(async () => {
    // A repository resolved off the root container leaves a transaction open and
    // TRUNCATE would block on it forever; settle(false) is a no-op when none is open.
    await container.resolve('uow').settle(false);
    // email_delivery is not in resetDb's TRUNCATE list but is reached by CASCADE
    // through its access_grant_id FK.
    await resetIntegrationTestDb(database);
  });

  const loggedIn = { isLoggedIn: true as const };

  const createAlbum = async (title: string): Promise<string> => {
    const res = await executeGraphQL<CreateAlbumResponse>({
      query: createAlbumMutation,
      variables: { input: { title } },
      context: loggedIn,
    });
    expect(res.json.errors).toBeUndefined();
    const albumId = res.json.data?.createAlbum.data?.albumId;
    if (!albumId) throw new Error('expected albumId');
    return albumId;
  };

  /** Share the album by email and return the access_grant id that was written. */
  const shareWith = async (albumId: string, email: string): Promise<string> => {
    const res = await executeGraphQL<GrantResponse>({
      query: grantForAlbumMutation,
      variables: { input: { albumId, grantedToHandles: [email] } },
      context: loggedIn,
    });
    expect(res.json.errors).toBeUndefined();
    expect(res.json.data?.grantUserAuthorizationForAlbum.data?.failed).toEqual([]);

    const grant = await database('accessGrant')
      .where({ albumId })
      .whereNull('revokedAt')
      .first<{ id: string }>('id');
    if (!grant) throw new Error('expected an access_grant for the share');
    return grant.id;
  };

  /**
   * Insert an email_delivery row as the SES consumer would. `sentAt` is what the
   * DISTINCT ON orders by; `statusUpdatedAt` is null until an SES event lands, which
   * is what makes the COALESCE in the subquery load-bearing for PENDING.
   */
  const insertDelivery = async ({
    accessGrantId,
    status,
    sentAt,
    statusUpdatedAt,
  }: {
    accessGrantId: string;
    status: EmailStatus;
    sentAt: Date;
    statusUpdatedAt?: Date;
  }): Promise<void> => {
    await database('emailDelivery').insert({
      id: randomUUID(),
      sesMessageId: `ses-${randomUUID()}`,
      accessGrantId,
      emailKind: EmailKind.albumShared.value,
      recipientEmail: VIEWER_A_EMAIL,
      status: status.value,
      sentAt,
      statusUpdatedAt,
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
  };

  const rosterFor = async (albumId: string) => {
    const res = await executeGraphQL<RosterResponse>({
      query: rosterQuery,
      variables: { albumId },
      context: loggedIn,
    });
    expect(res.json.errors).toBeUndefined();
    const shares = res.json.data?.viewer?.album?.emailShares;
    if (!shares) throw new Error('expected emailShares on the roster');
    return shares;
  };

  describe('the revival seam', () => {
    it('reports DELIVERED with the SES event time for a delivered invite', async () => {
      const albumId = await createAlbum('roster-delivered');
      const grantId = await shareWith(albumId, VIEWER_A_EMAIL);
      const sentAt = new Date('2026-09-01T10:00:00.000Z');
      const statusUpdatedAt = new Date('2026-09-01T10:00:04.000Z');

      await insertDelivery({
        accessGrantId: grantId,
        status: EmailStatus.delivery,
        sentAt,
        statusUpdatedAt,
      });

      const [row] = await rosterFor(albumId);
      expect(row.email).toBe(VIEWER_A_EMAIL);
      // The whole point: a status that IS present resolves to a state. An un-revived
      // status yields `.state === undefined`, which fails the non-null `state` field
      // and nulls `delivery` out — indistinguishable from "no delivery row" unless
      // something asserts on a populated one, as here.
      expect(row.delivery).not.toBeNull();
      expect(row.delivery?.state).toBe('DELIVERED');
      // status_updated_at wins over sent_at once an event has landed.
      expect(new Date(row.delivery!.at).toISOString()).toBe(statusUpdatedAt.toISOString());
    });

    it('reports FAILED for a permanent bounce', async () => {
      const albumId = await createAlbum('roster-bounced');
      const grantId = await shareWith(albumId, VIEWER_A_EMAIL);

      await insertDelivery({
        accessGrantId: grantId,
        status: EmailStatus.bouncePermanent,
        sentAt: new Date('2026-09-01T10:00:00.000Z'),
        statusUpdatedAt: new Date('2026-09-01T10:00:09.000Z'),
      });

      const [row] = await rosterFor(albumId);
      expect(row.delivery?.state).toBe('FAILED');
    });

    it('falls back to sent_at for a send with no SES event yet', async () => {
      const albumId = await createAlbum('roster-pending');
      const grantId = await shareWith(albumId, VIEWER_A_EMAIL);
      const sentAt = new Date('2026-09-01T10:00:00.000Z');

      // statusUpdatedAt is null here — exactly the state a row sits in between the
      // send and the first SES event.
      await insertDelivery({ accessGrantId: grantId, status: EmailStatus.send, sentAt });

      const [row] = await rosterFor(albumId);
      expect(row.delivery?.state).toBe('PENDING');
      expect(new Date(row.delivery!.at).toISOString()).toBe(sentAt.toISOString());
    });
  });

  describe('the collapse', () => {
    it('reports a transient bounce as DELIVERED and never leaks the raw status', async () => {
      const albumId = await createAlbum('roster-transient');
      const grantId = await shareWith(albumId, VIEWER_A_EMAIL);

      await insertDelivery({
        accessGrantId: grantId,
        status: EmailStatus.bounceTransient,
        sentAt: new Date('2026-09-01T10:00:00.000Z'),
        statusUpdatedAt: new Date('2026-09-01T10:00:06.000Z'),
      });

      const res = await executeGraphQL<RosterResponse>({
        query: rosterQuery,
        variables: { albumId },
        context: loggedIn,
      });
      const [row] = res.json.data?.viewer?.album?.emailShares ?? [];
      expect(row.delivery?.state).toBe('DELIVERED');
      // The raw wire value must not appear anywhere in the response body.
      expect(JSON.stringify(res.json)).not.toContain(EmailStatus.bounceTransient.value);
    });

    it('reports a complaint as DELIVERED', async () => {
      const albumId = await createAlbum('roster-complaint');
      const grantId = await shareWith(albumId, VIEWER_A_EMAIL);

      await insertDelivery({
        accessGrantId: grantId,
        status: EmailStatus.complaint,
        sentAt: new Date('2026-09-01T10:00:00.000Z'),
        statusUpdatedAt: new Date('2026-09-01T10:00:07.000Z'),
      });

      const [row] = await rosterFor(albumId);
      expect(row.delivery?.state).toBe('DELIVERED');
    });
  });

  describe('latest-by-sent_at', () => {
    it('a resend supersedes the earlier delivery', async () => {
      const albumId = await createAlbum('roster-resend');
      const grantId = await shareWith(albumId, VIEWER_A_EMAIL);

      // Inserted newest-first so a DISTINCT ON that ordered by insertion (or by
      // created_at, which both rows share to the millisecond) would pick the wrong one.
      await insertDelivery({
        accessGrantId: grantId,
        status: EmailStatus.bouncePermanent,
        sentAt: new Date('2026-09-02T10:00:00.000Z'),
        statusUpdatedAt: new Date('2026-09-02T10:00:05.000Z'),
      });
      await insertDelivery({
        accessGrantId: grantId,
        status: EmailStatus.delivery,
        sentAt: new Date('2026-09-01T10:00:00.000Z'),
        statusUpdatedAt: new Date('2026-09-01T10:00:05.000Z'),
      });

      const [row] = await rosterFor(albumId);
      expect(row.delivery?.state).toBe('FAILED');
    });

    it('keeps one roster row per grant when several deliveries exist', async () => {
      const albumId = await createAlbum('roster-fanout');
      const grantId = await shareWith(albumId, VIEWER_A_EMAIL);

      await insertDelivery({
        accessGrantId: grantId,
        status: EmailStatus.send,
        sentAt: new Date('2026-09-01T10:00:00.000Z'),
      });
      await insertDelivery({
        accessGrantId: grantId,
        status: EmailStatus.delivery,
        sentAt: new Date('2026-09-01T11:00:00.000Z'),
        statusUpdatedAt: new Date('2026-09-01T11:00:03.000Z'),
      });

      // The join must not fan the roster out — one grant, one row.
      const roster = await rosterFor(albumId);
      expect(roster).toHaveLength(1);
      expect(roster[0].delivery?.state).toBe('DELIVERED');
    });
  });

  describe('no delivery row', () => {
    it('returns a null delivery for a grant that predates delivery tracking', async () => {
      const albumId = await createAlbum('roster-untracked');
      await shareWith(albumId, VIEWER_A_EMAIL);

      const [row] = await rosterFor(albumId);
      // The share itself is intact — only the delivery is unknown.
      expect(row.email).toBe(VIEWER_A_EMAIL);
      expect(row.delivery ?? null).toBeNull();
    });

    it('ignores a delivery belonging to a different grant', async () => {
      const albumId = await createAlbum('roster-other-grant');
      const otherAlbumId = await createAlbum('roster-other-album');
      await shareWith(albumId, VIEWER_A_EMAIL);
      const otherGrantId = await shareWith(otherAlbumId, VIEWER_A_EMAIL);

      await insertDelivery({
        accessGrantId: otherGrantId,
        status: EmailStatus.bouncePermanent,
        sentAt: new Date('2026-09-01T10:00:00.000Z'),
        statusUpdatedAt: new Date('2026-09-01T10:00:05.000Z'),
      });

      const [row] = await rosterFor(albumId);
      expect(row.delivery ?? null).toBeNull();
      // ...and the grant that does own it still reports it.
      const [otherRow] = await rosterFor(otherAlbumId);
      expect(otherRow.delivery?.state).toBe('FAILED');
    });
  });

  it('still reports delivery for a grant to a pending (no-account) invitee', async () => {
    const albumId = await createAlbum('roster-guest');
    const guestEmail = `guest-${randomUUID()}@example.test`;
    const grantId = await shareWith(albumId, guestEmail);

    await insertDelivery({
      accessGrantId: grantId,
      status: EmailStatus.bouncePermanent,
      sentAt: new Date('2026-09-01T10:00:00.000Z'),
      statusUpdatedAt: new Date('2026-09-01T10:00:05.000Z'),
    });

    const [row] = await rosterFor(albumId);
    expect(row.email).toBe(guestEmail);
    // A guest invite that bounces is the exact bug that started this: a person who
    // never had an account and never got the mail.
    expect(row.delivery?.state).toBe('FAILED');
  });
});
