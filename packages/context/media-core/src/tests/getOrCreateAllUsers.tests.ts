/**
 * Unit coverage for getOrCreateAllUsers (inviteUsersService.ts) — the recipient
 * resolution step every share runs through. Pure logic, no DB: userRepository and
 * createUserWriteService are stubbed.
 *
 * Oracle:
 *  - normalize: every handle is trim()+toLowerCase()'d before lookup/creation, so
 *    ` Bob@X.com ` resolves the same user as `bob@x.com`.
 *  - dedup: case-/whitespace-variants of one email collapse to a SINGLE entry, so a
 *    duplicate in one share never mints two shadow users / two grants.
 *  - all-or-nothing: if any createUserWriteService call fails, the whole result fails
 *    with that error (no partial user set is returned).
 *  - merge: existing users and freshly-created pending users are both returned.
 */
import assert from 'node:assert';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ContractError, fail, ok } from '@packages/contracts';

import type { PendingUser, User } from '@packages/media-core';
import { getOrCreateAllUsers } from '@packages/media-core';
import type { UserRepository } from '../repositories/domainRepositories/userRepository';
import type { CreateUserWriteService } from '../services/writeServices/user/createUserWriteService';

const ACTOR = 'actor-1';

/** Minimal User/PendingUser stand-in — getOrCreateAllUsers only ever calls .email(). */
const fakeUser = (email: string, kind: 'active' | 'pending' = 'active'): User | PendingUser =>
  ({ kind, email: () => email }) as unknown as User | PendingUser;

type Harness = {
  getAllUsersByEmail: jest.Mock<UserRepository['getAllUsersByEmail']>;
  createUser: jest.Mock<CreateUserWriteService>;
  userRepository: UserRepository;
  createUserWriteService: CreateUserWriteService;
};

const makeHarness = (existing: (User | PendingUser)[]): Harness => {
  const getAllUsersByEmail = jest.fn<UserRepository['getAllUsersByEmail']>(async () => existing);
  // Default: every requested non-user is created successfully as a pending shadow user.
  const createUser = jest.fn<CreateUserWriteService>(async ({ email }) =>
    ok({ user: fakeUser(email, 'pending') as PendingUser }),
  );
  return {
    getAllUsersByEmail,
    createUser,
    userRepository: { getAllUsersByEmail } as unknown as UserRepository,
    createUserWriteService: createUser,
  };
};

describe('getOrCreateAllUsers', () => {
  let h: Harness;
  beforeEach(() => {
    h = makeHarness([]);
  });

  describe('normalization', () => {
    it('looks up and creates users by the trimmed, lowercased email', async () => {
      const result = await getOrCreateAllUsers(
        ['  Bob@Example.COM '],
        h.userRepository,
        h.createUserWriteService,
        ACTOR,
      );

      expect(result.success).toBe(true);
      // Lookup happens with the normalized handle...
      expect(h.getAllUsersByEmail).toHaveBeenCalledWith(['bob@example.com']);
      // ...and so does creation.
      expect(h.createUser).toHaveBeenCalledTimes(1);
      expect(h.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'bob@example.com', actorId: ACTOR }),
      );
    });

    it('matches an existing user whose stored email differs only by case/whitespace', async () => {
      h = makeHarness([fakeUser('Bob@Example.com')]);

      const result = await getOrCreateAllUsers(
        ['bob@example.com'],
        h.userRepository,
        h.createUserWriteService,
        ACTOR,
      );

      expect(result.success).toBe(true);
      // The existing user satisfied the request — no shadow user was created.
      expect(h.createUser).not.toHaveBeenCalled();
      assert(result.success);
      expect(result.value).toHaveLength(1);
    });
  });

  describe('dedup', () => {
    it('collapses case/whitespace variants of one email into a single created user', async () => {
      const result = await getOrCreateAllUsers(
        ['a@x.com', 'A@x.com', ' a@x.com '],
        h.userRepository,
        h.createUserWriteService,
        ACTOR,
      );

      expect(result.success).toBe(true);
      // Deduped BEFORE lookup and creation: one normalized email, one create call.
      expect(h.getAllUsersByEmail).toHaveBeenCalledWith(['a@x.com']);
      expect(h.createUser).toHaveBeenCalledTimes(1);
      assert(result.success);
      expect(result.value).toHaveLength(1);
    });
  });

  describe('all-or-nothing failure surfacing', () => {
    it('returns the failure when any user creation fails, and returns no users', async () => {
      // Second email fails to create; the whole operation must surface that failure.
      h.createUser.mockImplementation(async ({ email }) =>
        email === 'bad@x.com'
          ? fail(ContractError.InvalidEmail)
          : ok({ user: fakeUser(email, 'pending') as PendingUser }),
      );

      const result = await getOrCreateAllUsers(
        ['good@x.com', 'bad@x.com'],
        h.userRepository,
        h.createUserWriteService,
        ACTOR,
      );

      expect(result.success).toBe(false);
      assert(!result.success);
      expect(result.error.equals(ContractError.InvalidEmail)).toBe(true);
    });
  });

  describe('merge', () => {
    it('returns existing users AND newly-created pending users together', async () => {
      h = makeHarness([fakeUser('existing@x.com', 'active')]);

      const result = await getOrCreateAllUsers(
        ['existing@x.com', 'new@x.com'],
        h.userRepository,
        h.createUserWriteService,
        ACTOR,
      );

      expect(result.success).toBe(true);
      expect(h.createUser).toHaveBeenCalledTimes(1);
      expect(h.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@x.com' }));
      assert(result.success);
      const emails = result.value.map((u) => u.email()).sort();
      expect(emails).toEqual(['existing@x.com', 'new@x.com']);
    });

    it('creates no users and returns an empty set for an empty recipient list', async () => {
      const result = await getOrCreateAllUsers(
        [],
        h.userRepository,
        h.createUserWriteService,
        ACTOR,
      );

      expect(result.success).toBe(true);
      expect(h.createUser).not.toHaveBeenCalled();
      assert(result.success);
      expect(result.value).toEqual([]);
    });
  });
});
