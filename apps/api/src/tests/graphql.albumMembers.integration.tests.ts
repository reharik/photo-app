/**
 * Integration coverage for album membership: AddAlbumMembers / RemoveAlbumMembers
 * and the Album.albumMembers query gate, against real Postgres.
 *
 * Asserts persisted album_member rows, NOT just response payloads — the batch
 * guard in both write services rejects the whole operation on any per-item
 * failure, and the uow must roll back rows already staged for the items that
 * "succeeded" before the failing one. A test that only checks the error code
 * would pass against a broken rollback.
 *
 * Driven through the GraphQL mutations so the real uow finalize path runs
 * (useScopedContainer commits iff the execution result has no GraphQL errors
 * and no resolver latched shouldRollback).
 *
 * Membership model under test (see review notes):
 *  - membership is separate from authorization; editing rights come from the
 *    member's role (owner/admin may add members; contributor may not),
 *  - the member list is visible to MEMBERS ONLY — a non-member with an active
 *    album grant can view the album but must NOT see the roster,
 *  - batch semantics are all-or-nothing (PARTIAL_ALBUM_MEMBER_CREATION /
 *    PARTIAL_ALBUM_MEMBER_REMOVAL reject the batch).
 */
import { randomUUID } from 'node:crypto';

import { ContractError } from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import { resetIntegrationTestDb } from './resetDb';
import {
  TEST_USER_A_ID,
  TEST_VIEWER_1_ID,
  TEST_VIEWER_A_ID,
  TEST_VIEWER_B_ID,
  TEST_VIEWER_ONLY_ID,
} from './testViewerIds';

// Seeded, always-present active test users (see ensureTestViewerUsers).
const loggedInOwner = { isLoggedIn: true as const }; // defaults to TEST_VIEWER_1_ID ('Demo User')
const loggedInViewerA = {
  isLoggedIn: true as const,
  user: {
    id: TEST_VIEWER_A_ID,
    firstName: 'Viewer',
    lastName: 'A',
    email: 'test-viewer-a@example.test',
  },
};
const loggedInViewerB = {
  isLoggedIn: true as const,
  user: {
    id: TEST_VIEWER_B_ID,
    firstName: 'Viewer',
    lastName: 'B',
    email: 'test-viewer-b@example.test',
  },
};
const loggedInStranger = {
  isLoggedIn: true as const,
  user: {
    id: TEST_VIEWER_ONLY_ID,
    firstName: 'Viewer',
    lastName: 'Only',
    email: 'test-viewer-only@example.test',
  },
};

const createAlbumMutation = `
  mutation CreateAlbum($input: CreateAlbumInput!) {
    createAlbum(input: $input) {
      data { albumId }
      errors { code }
    }
  }
`;

const addMembersMutation = `
  mutation AddMembers($input: AddAlbumMembersInput!) {
    AddAlbumMembers(input: $input) {
      data { albumId albumMemberIds }
      errors { code }
    }
  }
`;

const removeMembersMutation = `
  mutation RemoveMembers($input: RemoveAlbumMembersInput!) {
    RemoveAlbumMembers(input: $input) {
      data { albumId albumMemberIds }
      errors { code }
    }
  }
`;

const albumMembersQuery = `
  query AlbumMembers($albumId: ID!) {
    viewer {
      album(id: $albumId) {
        id
        albumMembers(
          input: {
            collectionInfo: {
              pageInfo: { limit: 50, offset: 0 }
              sortBy: ROLE
              sortDir: ASC
            }
          }
        ) {
          nodes { id userId role firstName lastName }
          totalCount
        }
      }
    }
  }
`;

type PayloadError = { code: string };
type MembersMutationResponse = {
  data?: { albumId: string; albumMemberIds: string[] } | null;
  errors: PayloadError[] | null;
};
type AlbumMembersQueryResponse = {
  viewer: {
    album: {
      id: string;
      albumMembers: {
        nodes: { id: string; userId: string; role: string; firstName: string; lastName: string }[];
        totalCount: number;
      };
    } | null;
  } | null;
};

describe('album membership (integration)', () => {
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  let container: AwilixContainer<AppCradle>;
  let database: Knex;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    database = container.resolve('database');
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database);
  });

  const createAlbum = async (
    context: Record<string, unknown> = loggedInOwner,
    title = 'Membership test album',
  ): Promise<string> => {
    const res = await executeGraphQL<{
      createAlbum: { data?: { albumId: string } | null; errors: PayloadError[] | null };
    }>({ query: createAlbumMutation, variables: { input: { title } }, context });
    expect(res.json.errors).toBeUndefined();
    const albumId = res.json.data?.createAlbum.data?.albumId;
    expect(albumId).toBeTruthy();
    if (!albumId) throw new Error('expected albumId');
    return albumId;
  };

  const addMembers = (
    albumId: string,
    userIds: string[],
    role = 'CONTRIBUTOR',
    context: Record<string, unknown> = loggedInOwner,
  ) =>
    executeGraphQL<{ AddAlbumMembers: MembersMutationResponse }>({
      query: addMembersMutation,
      variables: { input: { albumId, userIds, role } },
      context,
    });

  const removeMembers = (
    albumId: string,
    albumMemberIds: string[],
    context: Record<string, unknown> = loggedInOwner,
  ) =>
    executeGraphQL<{ RemoveAlbumMembers: MembersMutationResponse }>({
      query: removeMembersMutation,
      variables: { input: { albumId, albumMemberIds } },
      context,
    });

  const memberRows = (albumId: string) =>
    database('albumMember').where({ albumId }).orderBy('createdAt', 'asc');

  const memberRowFor = (albumId: string, userId: string) =>
    database('albumMember').where({ albumId, userId }).first();

  /** Users created mid-test are wiped by the afterEach TRUNCATE; no per-test cleanup needed. */
  const seedUser = async (userStatus: 'ACTIVE' | 'PENDING'): Promise<string> => {
    const id = randomUUID();
    await database('user').insert({
      id,
      email: `member-${id}@example.test`,
      firstName: 'Seeded',
      lastName: userStatus === 'PENDING' ? 'Pending' : 'Active',
      userStatus,
      emailVerified: true,
      createdBy: id,
      updatedBy: id,
    });
    return id;
  };

  /**
   * Active USER-kind album authorization, seeded directly: the share mutation is not
   * the code under test, and a raw row keeps this suite independent of the share
   * flow. Must satisfy access_grant_kind_grantee_check (USER -> granted_to_user set,
   * link_token null) and access_grant_operations_check (subset of VIEW/COMMENT/DOWNLOAD).
   */
  const seedAlbumGrant = async (albumId: string, grantedToUser: string): Promise<void> => {
    await database('accessGrant').insert({
      id: randomUUID(),
      albumId,
      grantedBy: TEST_VIEWER_1_ID,
      grantedToUser,
      kind: 'USER',
      // USER rows are never converted; OWNER is the honest value (0026 made origin NOT NULL).
      origin: 'OWNER',
      // COMMENT, not VIEW: the DB CHECK admits 'VIEW' but the domain Operation
      // smart-enum has no such member — any path that revives operations would throw.
      operations: ['COMMENT'],
      createdBy: TEST_VIEWER_1_ID,
      updatedBy: TEST_VIEWER_1_ID,
    });
  };

  const queryMembers = (albumId: string, context: Record<string, unknown>) =>
    executeGraphQL<AlbumMembersQueryResponse>({
      query: albumMembersQuery,
      variables: { albumId },
      context,
    });

  describe('AddAlbumMembers happy path', () => {
    it('persists album_member rows with role, ids, and audit columns', async () => {
      const albumId = await createAlbum();

      const res = await addMembers(albumId, [TEST_VIEWER_A_ID, TEST_VIEWER_B_ID]);

      expect(res.json.errors).toBeUndefined();
      const payload = res.json.data?.AddAlbumMembers;
      expect(payload?.errors ?? []).toEqual([]);
      expect(payload?.data?.albumId).toBe(albumId);
      expect(payload?.data?.albumMemberIds).toHaveLength(2);

      // Owner row from createAlbum + the two added members.
      const rows = await memberRows(albumId);
      expect(rows).toHaveLength(3);

      const rowA = await memberRowFor(albumId, TEST_VIEWER_A_ID);
      const rowB = await memberRowFor(albumId, TEST_VIEWER_B_ID);
      for (const row of [rowA, rowB]) {
        expect(row).toBeDefined();
        expect(row.albumId).toBe(albumId);
        expect(String(row.role)).toBe('CONTRIBUTOR');
        // Audit: the acting owner stamped the rows.
        expect(row.createdBy).toBe(TEST_VIEWER_1_ID);
        expect(row.updatedBy).toBe(TEST_VIEWER_1_ID);
        expect(row.createdAt).toBeTruthy();
        expect(row.updatedAt).toBeTruthy();
      }
      // Payload ids are the persisted row ids.
      expect((payload?.data?.albumMemberIds ?? []).sort()).toEqual([rowA.id, rowB.id].sort());
    });
  });

  describe('RemoveAlbumMembers happy path', () => {
    it('owner removes a contributor; the row is gone, other rows remain', async () => {
      const albumId = await createAlbum();
      await addMembers(albumId, [TEST_VIEWER_A_ID, TEST_VIEWER_B_ID]);
      const rowA = await memberRowFor(albumId, TEST_VIEWER_A_ID);
      expect(rowA).toBeDefined();

      const res = await removeMembers(albumId, [rowA.id]);

      expect(res.json.errors).toBeUndefined();
      const payload = res.json.data?.RemoveAlbumMembers;
      expect(payload?.errors ?? []).toEqual([]);
      expect(payload?.data?.albumMemberIds).toEqual([rowA.id]);

      expect(await memberRowFor(albumId, TEST_VIEWER_A_ID)).toBeUndefined();
      // Owner and B untouched.
      expect(await memberRowFor(albumId, TEST_VIEWER_1_ID)).toBeDefined();
      expect(await memberRowFor(albumId, TEST_VIEWER_B_ID)).toBeDefined();
    });
  });

  describe('batch rejection rolls back ALL rows', () => {
    it('inactive (PENDING) user in the batch: nothing persists, not even the valid member', async () => {
      const albumId = await createAlbum();
      const pendingUserId = await seedUser('PENDING');

      const res = await addMembers(albumId, [TEST_VIEWER_A_ID, pendingUserId]);

      const payload = res.json.data?.AddAlbumMembers;
      expect(payload?.data ?? null).toBeNull();
      expect(payload?.errors?.map((e) => e.code)).toEqual([
        ContractError.PartialAlbumMemberCreation.code,
      ]);

      // The critical assertion: the OTHER (valid) member was NOT persisted.
      expect(await memberRowFor(albumId, TEST_VIEWER_A_ID)).toBeUndefined();
      expect(await memberRowFor(albumId, pendingUserId)).toBeUndefined();
      expect(await memberRows(albumId)).toHaveLength(1); // owner only
    });

    it('already-a-member in the batch: nothing persists, not even the new member', async () => {
      const albumId = await createAlbum();
      await addMembers(albumId, [TEST_VIEWER_A_ID]);

      const res = await addMembers(albumId, [TEST_VIEWER_B_ID, TEST_VIEWER_A_ID]);

      const payload = res.json.data?.AddAlbumMembers;
      expect(payload?.data ?? null).toBeNull();
      expect(payload?.errors?.map((e) => e.code)).toEqual([
        ContractError.PartialAlbumMemberCreation.code,
      ]);

      expect(await memberRowFor(albumId, TEST_VIEWER_B_ID)).toBeUndefined();
      expect(await memberRows(albumId)).toHaveLength(2); // owner + A from the first call
    });

    it('unauthorized actor (contributor): nothing persists and the batch is rejected', async () => {
      const albumId = await createAlbum();
      await addMembers(albumId, [TEST_VIEWER_A_ID]); // A is CONTRIBUTOR: may not add members

      const res = await addMembers(albumId, [TEST_VIEWER_B_ID], 'CONTRIBUTOR', loggedInViewerA);

      const payload = res.json.data?.AddAlbumMembers;
      expect(payload?.data ?? null).toBeNull();
      expect(payload?.errors?.map((e) => e.code)).toEqual([
        ContractError.PartialAlbumMemberCreation.code,
      ]);

      expect(await memberRowFor(albumId, TEST_VIEWER_B_ID)).toBeUndefined();
    });

    it('non-member actor: nothing persists and the batch is rejected', async () => {
      const albumId = await createAlbum();

      const res = await addMembers(albumId, [TEST_VIEWER_B_ID], 'CONTRIBUTOR', loggedInStranger);

      const payload = res.json.data?.AddAlbumMembers;
      expect(payload?.data ?? null).toBeNull();
      expect(payload?.errors?.map((e) => e.code)).toEqual([
        ContractError.PartialAlbumMemberCreation.code,
      ]);
      expect(await memberRowFor(albumId, TEST_VIEWER_B_ID)).toBeUndefined();
    });

    it('remove batch containing the owner: the removable member survives the rollback', async () => {
      const albumId = await createAlbum();
      await addMembers(albumId, [TEST_VIEWER_A_ID]);
      const rowA = await memberRowFor(albumId, TEST_VIEWER_A_ID);
      const ownerRow = await memberRowFor(albumId, TEST_VIEWER_1_ID);

      const res = await removeMembers(albumId, [rowA.id, ownerRow.id]);

      const payload = res.json.data?.RemoveAlbumMembers;
      expect(payload?.data ?? null).toBeNull();
      expect(payload?.errors?.map((e) => e.code)).toEqual([
        ContractError.PartialAlbumMemberRemoval.code,
      ]);

      // The critical assertion: A's row (a valid removal on its own) was NOT deleted.
      expect(await memberRowFor(albumId, TEST_VIEWER_A_ID)).toBeDefined();
      expect(await memberRowFor(albumId, TEST_VIEWER_1_ID)).toBeDefined();
    });
  });

  describe('validation', () => {
    it('missing user id: USER_DOES_NOT_EXIST and no rows written', async () => {
      const albumId = await createAlbum();

      const res = await addMembers(albumId, [TEST_VIEWER_A_ID, randomUUID()]);

      const payload = res.json.data?.AddAlbumMembers;
      expect(payload?.data ?? null).toBeNull();
      expect(payload?.errors?.map((e) => e.code)).toEqual([ContractError.UserDoesNotExist.code]);

      expect(await memberRowFor(albumId, TEST_VIEWER_A_ID)).toBeUndefined();
      expect(await memberRows(albumId)).toHaveLength(1); // owner only
    });
  });

  describe('owner invariants', () => {
    it('a second OWNER cannot be added', async () => {
      const albumId = await createAlbum();

      const res = await addMembers(albumId, [TEST_USER_A_ID], 'OWNER');

      const payload = res.json.data?.AddAlbumMembers;
      expect(payload?.data ?? null).toBeNull();
      expect(payload?.errors?.map((e) => e.code)).toEqual([
        ContractError.PartialAlbumMemberCreation.code,
      ]);
      expect(await memberRowFor(albumId, TEST_USER_A_ID)).toBeUndefined();
    });

    it('the owner cannot be removed', async () => {
      const albumId = await createAlbum();
      const ownerRow = await memberRowFor(albumId, TEST_VIEWER_1_ID);

      const res = await removeMembers(albumId, [ownerRow.id]);

      const payload = res.json.data?.RemoveAlbumMembers;
      expect(payload?.data ?? null).toBeNull();
      expect(payload?.errors?.map((e) => e.code)).toEqual([
        ContractError.PartialAlbumMemberRemoval.code,
      ]);
      expect(await memberRowFor(albumId, TEST_VIEWER_1_ID)).toBeDefined();
    });
  });

  describe('albumMembers query gate (members-only)', () => {
    it('a member sees the FULL member list, not just their own row', async () => {
      const albumId = await createAlbum();
      await addMembers(albumId, [TEST_VIEWER_A_ID]);

      // Queried as A (a plain contributor): both the owner and A must come back.
      // This is the regression test for the viewer-filter bug where the roster
      // collapsed to the viewer's own membership row.
      const res = await queryMembers(albumId, loggedInViewerA);

      expect(res.json.errors).toBeUndefined();
      const members = res.json.data?.viewer?.album?.albumMembers;
      expect(members?.totalCount).toBe(2);
      const byUser = new Map((members?.nodes ?? []).map((n) => [n.userId, n]));
      expect(byUser.size).toBe(2);
      expect(byUser.get(TEST_VIEWER_1_ID)?.role).toBe('OWNER');
      expect(byUser.get(TEST_VIEWER_A_ID)?.role).toBe('CONTRIBUTOR');
      expect(byUser.get(TEST_VIEWER_1_ID)?.firstName).toBe('Demo');
      expect(byUser.get(TEST_VIEWER_A_ID)?.firstName).toBe('Viewer');
    });

    it('a grant-holder (non-member) can view the album but sees NO members', async () => {
      const albumId = await createAlbum();
      await addMembers(albumId, [TEST_VIEWER_A_ID]);
      await seedAlbumGrant(albumId, TEST_VIEWER_B_ID);

      const res = await queryMembers(albumId, loggedInViewerB);

      expect(res.json.errors).toBeUndefined();
      const album = res.json.data?.viewer?.album;
      // The album itself is visible through the grant...
      expect(album?.id).toBe(albumId);
      // ...but the roster is members-only.
      expect(album?.albumMembers.nodes).toEqual([]);
      expect(album?.albumMembers.totalCount).toBe(0);
    });

    it('a stranger cannot see the album at all', async () => {
      const albumId = await createAlbum();
      await addMembers(albumId, [TEST_VIEWER_A_ID]);

      const res = await queryMembers(albumId, loggedInStranger);

      expect(res.json.data?.viewer?.album ?? null).toBeNull();
    });
  });
});
