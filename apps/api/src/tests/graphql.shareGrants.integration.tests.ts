/**
 * Integration coverage for grantUserAuthorizationsForMediaItems (the share write
 * path) against real Postgres, asserting the persisted rows — NOT just the response
 * payload. This mutation now runs through the merged grantUserAuthorization service,
 * which wraps loose media items in a generated shadow album and grants at ALBUM scope.
 * Closes the gaps the e2e specs can't see:
 *  - mixed recipients (active + non-user) resolved in ONE call,
 *  - the ownership guard (share an item you don't own),
 *  - the PartialShareFailure all-or-nothing guarantee.
 *
 * Driven through the GraphQL mutation so the real uow finalize path runs
 * (useScopedContainer commits iff the execution result has no GraphQL errors).
 */
import { randomUUID } from 'node:crypto';

import { ContractError, MediaItemStatus } from '@packages/contracts';
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
import { TEST_VIEWER_A_ID, TEST_VIEWER_B_ID } from './testViewerIds';

// Seeded, always-present test users (see ensureTestViewerUsers).
const VIEWER_1_EMAIL = 'test-viewer-1@example.test';
const VIEWER_A_EMAIL = 'test-viewer-a@example.test';
const VIEWER_B_EMAIL = 'test-viewer-b@example.test';

const loggedInViewer1 = { isLoggedIn: true as const };
const loggedInViewerA = {
  isLoggedIn: true as const,
  user: { id: TEST_VIEWER_A_ID, firstName: 'Viewer', lastName: 'A', email: VIEWER_A_EMAIL },
};

const createMediaUploadMutation = `
  mutation {
    createMediaUpload(input: { kind: PHOTO, mimeType: "image/png" }) {
      data { mediaItemId }
      errors { code }
    }
  }
`;

const finalizeMediaUploadMutation = `
  mutation FinalizeMedia($id: ID!) {
    finalizeMediaUpload(input: { mediaItemId: $id }) {
      data { mediaItemId status }
      errors { code }
    }
  }
`;

const grantMutation = `
  mutation Grant($input: GrantUserAuthorizationsForMediaItemsInput!) {
    grantUserAuthorizationsForMediaItems(input: $input) {
      errors { code }
    }
  }
`;

type WriteMutationResponse<T> = { data?: T; errors: { code: string }[] };
type GrantResponse = {
  grantUserAuthorizationsForMediaItems?: { errors: { code: string }[] | null };
};

describe('grantUserAuthorizationsForMediaItems (integration)', () => {
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

  /** Create + finalize a media item owned by the given viewer; returns its id. */
  const createOwnedMediaItem = async (context: Record<string, unknown>): Promise<string> => {
    const created = await executeGraphQL<{
      createMediaUpload: WriteMutationResponse<{ mediaItemId: string }>;
    }>({ query: createMediaUploadMutation, context });
    const mediaItemId = created.json.data?.createMediaUpload.data?.mediaItemId;
    expect(mediaItemId).toBeTruthy();
    if (!mediaItemId) throw new Error('expected mediaItemId');

    await seedIntegrationTestUploadedObject(
      database,
      integrationTestMediaStorage,
      mediaItemId,
      MINIMAL_PNG_1X1,
    );

    const finalized = await executeGraphQL<{
      finalizeMediaUpload: WriteMutationResponse<{ status: string }>;
    }>({ query: finalizeMediaUploadMutation, variables: { id: mediaItemId }, context });
    expect(finalized.json.data?.finalizeMediaUpload.data?.status).toBe(
      MediaItemStatus.processing.value,
    );
    // The worker that advances PROCESSING → READY does not run in integration tests, and
    // the share path refuses non-READY items. Promote directly, as the worker would.
    await database('mediaItem')
      .where({ id: mediaItemId })
      .update({ status: MediaItemStatus.ready.value });
    return mediaItemId;
  };

  const share = (
    input: {
      mediaItemIds: string[];
      grantedToHandles: string[];
    },
    context: Record<string, unknown> = loggedInViewer1,
  ) =>
    executeGraphQL<GrantResponse>({
      // The operation set is pinned server-side; the input no longer takes `operations`.
      query: grantMutation,
      variables: { input },
      context,
    });

  // User-addressed grants are matched by grantedToUser alone: PUBLIC rows have a NULL
  // grantee so they can never match. Do NOT filter on link_token nullness — a PENDING
  // grant carries BOTH the grantee and the invite token under the kind discriminator,
  // so the old `whereNull('linkToken')` heuristic silently excluded pending recipients.
  const itemGrantsFor = (grantedToUser: string, mediaItemId: string) =>
    database('accessGrant').where({ grantedToUser, mediaItemId });

  const albumGrantsFor = (grantedToUser: string, albumId: string) =>
    database('accessGrant').where({ grantedToUser, albumId });

  describe('mixed recipients (active + non-user) in one call', () => {
    // Sharing loose media items no longer mints one grant per (recipient × item). The
    // merged grantUserAuthorization service wraps the selected items in a generated
    // "shadow" album (isShadowAlbum) and grants at ALBUM scope for every recipient —
    // one code path for both the album share and the media-item share.
    it('grants album scope on the generated shadow album for the active user AND a shadow user', async () => {
      const item1 = await createOwnedMediaItem(loggedInViewer1);
      const item2 = await createOwnedMediaItem(loggedInViewer1);
      const nonUserEmail = `shadow-${randomUUID()}@example.test`;

      const res = await share({
        mediaItemIds: [item1, item2],
        grantedToHandles: [VIEWER_A_EMAIL, nonUserEmail],
      });

      // No GraphQL errors and no domain-error payload → the whole mixed call committed.
      expect(res.json.errors).toBeUndefined();
      expect(res.json.data?.grantUserAuthorizationsForMediaItems?.errors ?? []).toEqual([]);

      // The shadow album carrying the shared items.
      //
      // Found by the isShadowAlbum flag rather than by title: the title is generated
      // from the sharer's first name, so matching on it would couple this test to a seed
      // fixture's name. The DB is reset after every test, so the flag identifies exactly
      // the album this call created.
      const shadowAlbum = await database('album')
        .where({ isShadowAlbum: true })
        .first<{ id: string; title: string }>();
      expect(shadowAlbum).toBeDefined();
      // Untitled shares fall back to "Photos from {viewerFirstName}"; the sharer here is the
      // default logged-in viewer, seeded as firstName 'Demo' in ensureTestViewerUsers.
      expect(shadowAlbum.title).toBe('Photos from Demo');

      // Both selected items were folded into it.
      const albumItems = await database('albumItem')
        .where({ albumId: shadowAlbum.id })
        .select('mediaItemId');
      expect(albumItems.map((r) => r.mediaItemId).sort()).toEqual([item1, item2].sort());

      // Active recipient: a single album-scoped USER grant, not one grant per item.
      const viewerAGrants = await albumGrantsFor(TEST_VIEWER_A_ID, shadowAlbum.id);
      expect(viewerAGrants).toHaveLength(1);
      expect(viewerAGrants[0].kind).toBe('USER');

      // Non-user recipient: a PENDING shadow user row was minted for the email...
      const shadow = await database('user')
        .where({ email: nonUserEmail })
        .first<{ id: string; userStatus: unknown }>();
      expect(shadow).toBeDefined();
      const status =
        typeof shadow?.userStatus === 'string'
          ? shadow.userStatus
          : (shadow?.userStatus as { value: string }).value;
      expect(status).toBe('PENDING');

      // ...and it too gets an album-scoped grant, which materializes on activation.
      const shadowGrants = await albumGrantsFor(shadow.id, shadowAlbum.id);
      expect(shadowGrants).toHaveLength(1);

      // Under the kind discriminator the pending invite is ONE row carrying BOTH the
      // grantee and the invite token (kind PENDING). No separate public-link row is
      // minted at share time — activation later splits the PENDING row into USER +
      // PUBLIC, reusing its id.
      expect(shadowGrants[0].kind).toBe('PENDING');
      expect(shadowGrants[0].linkToken).toBeTruthy();
      expect(
        await database('accessGrant').where({ albumId: shadowAlbum.id, kind: 'PUBLIC' }),
      ).toHaveLength(0);

      // No item-scoped grants are written on this path any more.
      expect(await itemGrantsFor(TEST_VIEWER_A_ID, item1)).toHaveLength(0);
      expect(await itemGrantsFor(shadow.id, item1)).toHaveLength(0);
    });
  });

  describe('ownership guard', () => {
    it('rejects sharing an item the viewer does not own and writes no grant for it', async () => {
      // Item owned by Viewer A; Viewer 1 (default) tries to share it.
      const otherUsersItem = await createOwnedMediaItem(loggedInViewerA);

      const res = await share(
        { mediaItemIds: [otherUsersItem], grantedToHandles: [VIEWER_B_EMAIL] },
        loggedInViewer1,
      );

      expect(res.json.errors).toBeUndefined();
      const errs = res.json.data?.grantUserAuthorizationsForMediaItems?.errors ?? [];
      expect(errs.map((e) => e.code)).toContain(ContractError.MediaItemNotOwnedByViewer.code);

      // The guard fails before any write — no grant referencing that item exists.
      const grants = await database('accessGrant').where({ mediaItemId: otherUsersItem });
      expect(grants).toHaveLength(0);
      // And Viewer B was never granted anything.
      expect(await database('accessGrant').where({ grantedToUser: TEST_VIEWER_B_ID })).toHaveLength(
        0,
      );
    });
  });

  describe('partial-share all-or-nothing', () => {
    // Regression guard: a partial failure returns fail(PartialShareFailure) AFTER the
    // successful grants are written to the trx. That failure travels as a `success:false`
    // DATA payload, not a thrown GraphQL error, so it used to commit anyway (the partial
    // grants persisted). The write boundary now flags the per-request uow for rollback when
    // a mutation returns a failed OperationResult (authenticatedWriteResolver → uow.shouldRollback
    // → useScopedContainer), so the whole batch is rolled back and no grant rows survive.
    it('rolls back every grant in the batch when one recipient fails', async () => {
      const item1 = await createOwnedMediaItem(loggedInViewer1);
      const item2 = await createOwnedMediaItem(loggedInViewer1);

      const res = await share({
        mediaItemIds: [item1, item2],
        // VIEWER_A succeeds; VIEWER_1 (the owner/self) fails → partial failure.
        grantedToHandles: [VIEWER_A_EMAIL, VIEWER_1_EMAIL],
      });

      expect(res.json.errors).toBeUndefined();
      const errs = res.json.data?.grantUserAuthorizationsForMediaItems?.errors ?? [];
      expect(errs.map((e) => e.code)).toContain(ContractError.PartialShareFailure.code);

      // All-or-nothing: the grants that DID succeed (Viewer A) must not survive.
      expect(await database('accessGrant').where({ grantedToUser: TEST_VIEWER_A_ID })).toHaveLength(
        0,
      );
      // ...and neither does the shadow album the batch built to hang them off.
      expect(await database('album').where({ isShadowAlbum: true })).toHaveLength(0);
    });
  });
});
