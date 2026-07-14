/**
 * GUARD: the GraphQL write boundary must ROLL BACK the per-request unit of work when a
 * resolver returns a FAILED WriteResult (`success:false`) — even though that failure
 * travels as DATA in the `{ errors:[...] }` payload, never as a GraphQL `errors` entry.
 *
 * This is the exact property that was silently false in production: the boundary used to
 * commit whenever the GraphQL `errors` channel was empty, so a "fail-as-data" mutation
 * that had already written rows committed those rows anyway. The fix:
 *   authenticatedWriteResolver  — reads the typed WriteResult.success and, on failure,
 *                                 sets `uow.shouldRollback = true` (contextWrappers.ts).
 *   useScopedContainer          — commits iff `!result.errors?.length && !uow.shouldRollback`,
 *                                 otherwise rolls back (useScopedContainer.ts).
 *
 * Driven through the real GraphQL mutation so the full boundary runs
 * (useScopedContainer → authenticatedWriteResolver → resolver → shouldRollback → rollback).
 * A companion positive case proves the boundary still COMMITS a successful mutation — so
 * this guards "distinguishes commit from rollback", not merely "always rolls back".
 *
 * Canonical exposed case: grantUserAuthorizationsForMediaItems returns
 * fail(PartialShareFailure) AFTER writing access_grant rows, a pending shadow user, a
 * "Public Link Album", and share_contact rows. Every one of those writes must vanish.
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
import { TEST_VIEWER_A_ID } from './testViewerIds';

// Seeded, always-present test users (see ensureTestViewerUsers).
const VIEWER_1_EMAIL = 'test-viewer-1@example.test'; // the default logged-in viewer / item owner
const VIEWER_A_EMAIL = 'test-viewer-a@example.test'; // a valid recipient

const loggedInViewer1 = { isLoggedIn: true as const };

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

describe('write boundary: uow rollback on failed WriteResult (integration)', () => {
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

  /** Create + finalize a media item owned by the default viewer; returns its id. */
  const createOwnedMediaItem = async (): Promise<string> => {
    const created = await executeGraphQL<{
      createMediaUpload: WriteMutationResponse<{ mediaItemId: string }>;
    }>({ query: createMediaUploadMutation, context: loggedInViewer1 });
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
    }>({
      query: finalizeMediaUploadMutation,
      variables: { id: mediaItemId },
      context: loggedInViewer1,
    });
    expect(finalized.json.data?.finalizeMediaUpload.data?.status).toBe(
      MediaItemStatus.processing.value,
    );
    return mediaItemId;
  };

  const share = (input: { mediaItemIds: string[]; grantedToHandles: string[] }) =>
    executeGraphQL<GrantResponse>({
      // COMMENT is a real domain Operation (the SDL enum's VIEW is unbacked) — mirror the client.
      query: grantMutation,
      variables: { input: { operations: ['COMMENT'], ...input } },
      context: loggedInViewer1,
    });

  /** Total rows in each table this write path touches — the "nothing persisted" surface. */
  const persistedRowCounts = async () => {
    const [accessGrants, publicAlbums, shadowUsers, shareContacts] = await Promise.all([
      database('accessGrant').count<{ count: string }[]>('* as count').first(),
      database('album')
        .where({ title: 'Public Link Album' })
        .count<{ count: string }[]>('* as count')
        .first(),
      // Shadow (PENDING) users are the non-seeded users this op mints for a non-user handle.
      database('user')
        .whereRaw(`email LIKE 'shadow-%@example.test'`)
        .count<{ count: string }[]>('* as count')
        .first(),
      database('shareContact').count<{ count: string }[]>('* as count').first(),
    ]);
    return {
      accessGrants: Number(accessGrants?.count ?? 0),
      publicAlbums: Number(publicAlbums?.count ?? 0),
      shadowUsers: Number(shadowUsers?.count ?? 0),
      shareContacts: Number(shareContacts?.count ?? 0),
    };
  };

  describe('when a resolver fails AFTER writing (fail-as-data, no GraphQL error)', () => {
    it('rolls back the whole request — access_grant, shadow user, public-link album, and share_contact all vanish', async () => {
      const item1 = await createOwnedMediaItem();
      const item2 = await createOwnedMediaItem();
      const nonUserEmail = `shadow-${randomUUID()}@example.test`;

      // Recipients that WRITE before the failure:
      //   VIEWER_A_EMAIL  -> valid user: item-scoped access_grant rows + share_contact.
      //   nonUserEmail    -> non-user:   a PENDING shadow user, a "Public Link Album",
      //                                  and a tokenized public-link access_grant.
      //   VIEWER_1_EMAIL  -> self (the owner): the per-item grant that FAILS, forcing the
      //                                  service to return fail(PartialShareFailure) AFTER
      //                                  everything above was already written to the trx.
      const res = await share({
        mediaItemIds: [item1, item2],
        grantedToHandles: [VIEWER_A_EMAIL, nonUserEmail, VIEWER_1_EMAIL],
      });

      // Fail-as-data preserved: the failure rides in the payload `errors`, NOT the GraphQL
      // `errors` channel — the boundary must not have swallowed or promoted it.
      expect(res.json.errors).toBeUndefined();
      const errs = res.json.data?.grantUserAuthorizationsForMediaItems?.errors ?? [];
      expect(errs.map((e) => e.code)).toContain(ContractError.PartialShareFailure.code);

      // Nothing persisted — every table this path wrote to before the failure is empty.
      expect(await persistedRowCounts()).toEqual({
        accessGrants: 0,
        publicAlbums: 0,
        shadowUsers: 0,
        shareContacts: 0,
      });
    });
  });

  describe('when a resolver succeeds (companion positive case)', () => {
    it('commits — the successful share persists its access_grant and share_contact rows', async () => {
      const item = await createOwnedMediaItem();

      // Single valid recipient, no self-share, no failure → success → boundary commits.
      const res = await share({ mediaItemIds: [item], grantedToHandles: [VIEWER_A_EMAIL] });

      expect(res.json.errors).toBeUndefined();
      expect(res.json.data?.grantUserAuthorizationsForMediaItems?.errors ?? []).toEqual([]);

      // The item-scoped grant for Viewer A survived the commit...
      const itemGrants = await database('accessGrant')
        .where({ grantedToUser: TEST_VIEWER_A_ID, mediaItemId: item })
        .whereNull('linkToken');
      expect(itemGrants).toHaveLength(1);

      // ...and so did the share_contact projection (proves commit, not rollback).
      const counts = await persistedRowCounts();
      expect(counts.accessGrants).toBeGreaterThan(0);
      expect(counts.shareContacts).toBeGreaterThan(0);
    });
  });
});
