/**
 * Integration coverage for grantUserAuthorizationsForMediaItems (the share write
 * path) against real Postgres, asserting the persisted `access_grant` rows — NOT
 * just the response payload. Closes the gaps the e2e specs can't see:
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
      errors { code message }
    }
  }
`;

const finalizeMediaUploadMutation = `
  mutation FinalizeMedia($id: ID!) {
    finalizeMediaUpload(input: { mediaItemId: $id }) {
      data { mediaItemId status }
      errors { code message }
    }
  }
`;

const grantMutation = `
  mutation Grant($input: GrantUserAuthorizationsForMediaItemsInput!) {
    grantUserAuthorizationsForMediaItems(input: $input) {
      errors { code message }
    }
  }
`;

type WriteMutationResponse<T> = { data?: T; errors: { code: string; message: string }[] };
type GrantResponse = {
  grantUserAuthorizationsForMediaItems?: { errors: { code: string; message: string }[] | null };
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
    return mediaItemId;
  };

  const share = (
    input: {
      mediaItemIds: string[];
      grantedToHandles: string[];
      operations?: string[];
    },
    context: Record<string, unknown> = loggedInViewer1,
  ) =>
    executeGraphQL<GrantResponse>({
      // COMMENT/DOWNLOAD are the only operations the domain Operation smart-enum backs
      // (it has no VIEW, despite the SDL enum listing one) — mirror what the client sends.
      query: grantMutation,
      variables: { input: { operations: ['COMMENT'], ...input } },
      context,
    });

  const itemGrantsFor = (grantedToUser: string, mediaItemId: string) =>
    database('accessGrant').where({ grantedToUser, mediaItemId }).whereNull('linkToken');

  describe('mixed recipients (active + non-user) in one call', () => {
    // Regression guard: sharing the SAME media item with more than one recipient in one
    // call used to crash with `duplicate key ... "access_grant_pkey"` because the item
    // aggregate was saved once PER authorization (N recipients → N concurrent saves of the
    // same rows). grantAuthorizationForMediaItems now de-dupes item ids before saving, so
    // each item is persisted once regardless of recipient count.
    it('materializes item grants for the active user AND a shadow user + album grant for the non-user', async () => {
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

      // Active recipient: one item-scoped grant per item (granted_to_user set, no token).
      expect(await itemGrantsFor(TEST_VIEWER_A_ID, item1)).toHaveLength(1);
      expect(await itemGrantsFor(TEST_VIEWER_A_ID, item2)).toHaveLength(1);

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

      // ...and the shadow user also got an item-scoped grant per item (materializes for
      // them on activation).
      expect(await itemGrantsFor(shadow!.id, item1)).toHaveLength(1);
      expect(await itemGrantsFor(shadow!.id, item2)).toHaveLength(1);

      // The non-user branch additionally built a "Public Link Album" with a tokenized
      // public-link grant (link_token set, no granted_to_user), in the SAME call — proving
      // the active item-grant branch and the public-link branch both committed in one uow.
      const publicAlbum = await database('album')
        .where({ title: 'Public Link Album' })
        .first<{ id: string }>();
      expect(publicAlbum).toBeDefined();
      const linkGrant = await database('accessGrant')
        .where({ albumId: publicAlbum!.id })
        .whereNotNull('linkToken')
        .first();
      expect(linkGrant).toBeDefined();
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
    // a mutation returns a failed WriteResult (authenticatedWriteResolver → uow.shouldRollback
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
      expect(await itemGrantsFor(TEST_VIEWER_A_ID, item1)).toHaveLength(0);
      expect(await itemGrantsFor(TEST_VIEWER_A_ID, item2)).toHaveLength(0);
      expect(await database('accessGrant').where({ grantedToUser: TEST_VIEWER_A_ID })).toHaveLength(
        0,
      );
    });
  });
});
