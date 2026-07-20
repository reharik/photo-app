# RAI-76 — Auth test rewrite (autonomous run)

Working log for the auth test rewrite after the signup/verify/set-password
refactor. Source is read-only; only test files touched. No commits.

---

## Stream 0 — Investigation

### Test frameworks & runners

- **Unit / integration:** Jest (`ts-jest`, ESM via `NODE_OPTIONS=--experimental-vm-modules`).
  Nx targets per project.
  - API unit: `nx test api` → `jest --config jest.config.js`. `testMatch`
    `**/tests/**/*.tests.ts` and `*.spec/test.ts`, but **ignores**
    `*.integration.tests.ts` (`testPathIgnorePatterns`). `testEnvironment: node`.
  - API integration: `nx run api:test-integration` →
    `jest --config jest.integration.config.js`. `maxWorkers: 1`, `forceExit`,
    `testMatch` = `src/tests/**/*.integration.tests.ts`. Extra module mocks for
    `koa` and `@react-email/tailwind`.
  - media-core: `nx test media-core` → `jest`, `maxWorkers: 1`, `testMatch`
    `**/src/tests/**/*.tests.ts`.
- **Typecheck:** `nx typecheck <proj>` → `tsc --noEmit -p tsconfig.json`
  (`dependsOn` `^build`, `gen-gql`, `gen-ioc`). `tsconfig.spec.json` includes
  `src/**/*.tests.ts` + `src/tests/**/*.ts`, so **test files are typechecked**.
- **e2e:** Playwright (`packages/e2e`), `nx test e2e` → `playwright test`.
  `workers: 1`, `fullyParallel: false`. Assumes api (:3001), web (:5173),
  Postgres, and LocalStack SES already running (no `webServer` block; it does not
  start the app).

### Test DB setup / teardown / seeding

- **Integration (Jest):** real Postgres. `setupGraphqlIntegrationTests()` builds
  the real Awilix container from the committed IoC manifest, overrides
  `mediaStorage` (in-memory) and `notificationService` (noop), registers the knex
  handle on `globalThis.__photoappTestKnex`, and seeds stable users via
  `ensureTestViewerUsers`. `jestGlobalTeardown` destroys that knex pool.
  - Per-test cleanup: `resetIntegrationTestDb` → `resetDb` (raw `TRUNCATE ...
RESTART IDENTITY CASCADE`) then re-seed viewer users.
  - Stable user ids in `testViewerIds.ts`; seeded by `ensureTestViewerUsers.ts`
    (`ON CONFLICT (id) DO NOTHING`).
  - Running DB: docker `homeroll-dev-db-1`, host port **5433** (`apps/api/.env`
    `POSTGRES_PORT=5433`, db `photo_app`). DB is migrated through `0020`
    (`email_verification`, `rate_limit_event`, `user.user_status` present;
    `password_reset` **dropped**).
- **⚠️ Stale shared helper — `resetDb.ts`:** its `TRUNCATE` list still names
  `password_reset` (dropped in migration `0017`) and does **not** include
  `email_verification` / `rate_limit_event`. Against the current DB this
  `TRUNCATE` throws `relation "password_reset" does not exist`, which would make
  every integration test that calls `resetIntegrationTestDb` red at runtime
  (typecheck can't catch a missing table). See "Decisions" — I fixed this helper
  (it is a test file, not product source) and kept the new auth integration
  tests self-cleaning regardless.

### e2e framework / fixtures / auth helpers

- Custom `test` fixture (`fixtures/test.ts`) extends Playwright base with
  `userA`/`userB` sessions (fresh browser context each, seeded users from
  `apps/api/db/seeds`), `anonContext`/`anonPage`, `uniqueSuffix`, `grabTestImages`.
- **Logged-in state:** `fixtures/auth.ts` — `loginViaApi` POSTs
  `/api/auth/login` and stores the cookie on the browser context (fast path);
  `loginViaUi` drives the login form. `logoutViaApi` POSTs `/api/auth/logout`.
- `fixtures/db.ts` — singleton knex to the same Postgres for seeding/teardown
  (`getUserIdByEmail`, `closeDb`). `fixtures/users.ts` — `USER_A`/`USER_B` seed
  accounts. `global-setup.ts` upserts seed users before the run.
- **SES:** `fixtures/localstackSes.ts` reads LocalStack's SES message store
  (`http://localhost:4566/_aws/ses`) to fetch emails sent to a recipient — this
  is how a verification code / share-invite link is recovered in e2e.
- App is **not** stood up by Playwright; it must already be running. All four
  services are currently up (verified: pg:5433, api:3001, web:5173, localstack:4566).

### The two red files

- **`authPasswordReset.integration.tests.ts`** — tests the deleted
  `authService.forgotPassword` / `resetPassword` API against a `passwordReset`
  table that no longer exists, and asserts `ContractError.InvalidPasswordResetCode`
  (removed). Entirely dead. → **Deleted** (rule 2); intent folded into the new
  `verifyCodeAndSetPassword` integration tests (Stream 2).
- **`authController.tests.ts`** — tests `authController.forgotPassword` /
  `resetPassword`, neither of which exists on the new controller (now `login`,
  `logout`, `emailVerification`, `setPassword`, `me`, `publicAccess`). The
  controller's deps also changed (`authQueryService`, `container`, `rateLimiter`
  instead of `authService`). → **Rewritten** against the new shape (Stream 1/2).

### New auth surface (test targets)

- `AuthService.verifyCodeAndSetPassword` (SCOPED, uow-bound) —
  `apps/api/src/services/authService.ts`. The E1–E6 oracle target.
- `AuthQueryService` (singleton, bare knex) — `login`, `verifyEmail`,
  `hashPassword` (`apps/api/src/services/authQueryService.ts`). Note:
  `publicAccess` is commented out in source.
- `TokenVerifier.verifyJWTToken` — `apps/api/src/services/tokenVerifier.ts`.
- `AuthController` — `apps/api/src/controllers/authController.ts`.
- `SystemEmailVerificationRepository.bumpValidationAttempts` (autocommit, own
  connection) — the counter that must survive the uow rollback (E3).

### Plan for Streams 1–3

- **S1 (compile floor):** delete `authPasswordReset.integration.tests.ts`;
  rewrite `authController.tests.ts` against the new controller (login +
  setPassword + emailVerification, mocking `authQueryService` + `container` +
  `rateLimiter`). Get `nx typecheck` (api + media-core) green.
- **S2 (unit/integration):**
  - `authService.verifyCodeAndSetPassword` integration (real DB via container +
    `beginUnitOfWorkScope`): E1, E2, E3 (counter persists across rollback), E4,
    E6 (atomic save+consume, notify-after-commit). Plus a unit test with a fake
    uow for precise ordering (commit-before-notify, rollback-on-throw,
    committed-flag prevents double rollback).
  - `authQueryService` integration: login ok / bad creds, verifyEmail.
  - `tokenVerifier` unit: valid / expired / malformed.
- **S3 (e2e):** signup happy path (email→code→password→logged in), bad-then-good
  code, pending-user activation via share, public-link if supported.

---

## Stream 1 — Compile floor ✅ green

Baseline: `nx typecheck api` was RED — ~40 errors, ALL from the two red files
(the base `tsconfig.json` includes `src/**/*.ts`, so test files ARE typechecked).
`media-core` typecheck was already green.

- `authPasswordReset.integration.tests.ts` — **repurposed in place** (see Decisions:
  `rm`/`mv` are blocked in this environment). Its dead password-reset content was
  fully replaced by the new `verifyCodeAndSetPassword` integration tests, so no
  dead references remain. Kept the `.integration.tests.ts` suffix so it still runs
  under the integration config.
- `authController.tests.ts` — **rewritten** against the new controller (login,
  logout, emailVerification, setPassword, me, publicAccess) with fakes for
  `authQueryService`, `rateLimiter`, and the IoC `container` (a stub scope so the
  real `beginUnitOfWorkScope` runs and resolves the faked `authService`).

**Final state:** `tsc --noEmit -p tsconfig.json` → **api exit 0, media-core exit 0**.
(e2e typecheck has ONE pre-existing error in `tests/mediaViewer/viewReactAndEditItem.spec.ts`
— `Page` vs `Locator` — untouched by this work and unrelated to auth.)

---

## Stream 2 — Unit/integration coverage ✅

New/updated files and results (run: `nx test api` unit, `nx run api:test-integration`):

Unit (`jest.config.js`) — **29 passed / 29**:

- `authController.tests.ts` (rewritten) — 16 tests: login (missing fields, rate
  limit, bad creds, success+cookie), logout, emailVerification (invalid email,
  rate limited, issues code), setPassword (missing fields, short password, domain
  failure→400, success+cookie), me (401 / sanitized), publicAccess (400 / 200).
- `authService.verifyCodeAndSetPassword.tests.ts` (new) — 8 tests: E1 no row
  (reject+rollback, no save/bump), E2 locked (reject+rollback, no bump), E3 bad
  code (bump BEFORE rollback: order `['bump','rollback']`), E4 activate fail
  (rollback, no save/consume), E6 success ordering (`['save','consume','commit','notify']`,
  no rollback, welcome template), notify-result-failure still ok (no rollback),
  notify-REJECTION propagates but does NOT roll back the committed uow, pre-commit
  throw → rollback + rethrow.
- `tokenVerifier.tests.ts` (new) — 5 tests: valid → user; expired / malformed /
  wrong-secret → undefined; valid token but user gone → undefined.

Integration (`jest.integration.config.js`, real Postgres :5433) — **10 passed, 2 skipped**:

- `authQueryService.integration.tests.ts` (new) — 5 passed: login success
  (user+token, passwordHash stripped), wrong password → undefined, unknown user →
  undefined; verifyEmail stores a fresh live code; verifyEmail invalidates the
  previous live code.
- `authPasswordReset.integration.tests.ts` (repurposed) — 5 passed, 2 skipped:
  E1 no row, E2 lockout (no bump, not consumed), **E3 bad code — attemptCount
  increment PERSISTS across the uow rollback** (the whole point), E4 pending
  activate() fails (rolled back: not consumed, still PENDING, no password),
  E6 existing-active-user → password reset (password updated, verification consumed,
  notify AFTER commit via the consumed-verification signal, `passwordReset` template).
  **Skipped (2):** both E6 NEW-user cases — blocked by a confirmed source bug that
  makes a brand-new signup persist no user row (see Possible source bugs). Marked
  `it.skip` with an inline `// RAI-76` pointer, per HARD RULE 1.

Full integration suite after the shared-helper fixes: **43 passed, 1 failed, 6
skipped** (the 1 failure is `collectionPaging.integration.tests.ts` — an
album-item `createdAt`-ordering deep-equality assertion, unrelated to auth and
pre-existing; before the helper fixes it and the other 4 graphql suites couldn't
even start). 4 of the 6 skips are pre-existing skips in other suites; 2 are mine.

New test helper added: the spy `notificationService` in the authService
integration test — it records the COMMITTED db state (user row visible /
verification consumed) at notify time to prove notify runs post-commit.

---

## Stream 3 — E2E ✅ (partial — primary flow blocked by source bug)

`packages/e2e/tests/auth/signup.spec.ts` (new). Run against the live app —
**2 passed, 3 skipped**:

- ✅ email step sends a code and advances to the code step (existence-blind).
- ✅ an invalid code is rejected ("That code isn't right.") and keeps the user on
  the code step — the bad-code half of "bad code then correct code", and it
  exercises the real attempt-counter path end-to-end.
- ⏭️ happy-path signup (valid code → logged in) — **blocked** by the new-user
  persistence bug; `test.skip` with a note (not faked green).
- ⏭️ bad-code-then-correct-code login — the correct-code completion creates a new
  account → same bug; `test.skip` (bad-code half is covered above).
- ⏭️ pending-user activation — `test.skip`: needs the share-with-non-user fixture
  to mint the shadow user + pending grant and SES code retrieval; the activation
  path itself is NOT hit by the bug, so it is worth building once the bug is fixed.

Public-link scenario: not added — with the primary account-creation flow blocked
and no existing anonymous public-link auth e2e to extend cheaply, I left it out
rather than add a shallow placeholder. (Conservative default; logged here.)

---

## Decisions for Raif to audit

All edits are to TEST files only — no product source was modified (verified via
`git status`: the only changed non-test file, `authorizationReconciliation.ts`,
was already modified before this run and I did not touch it).

1. **Could not `rm`/`mv` the dead file — repurposed it in place.** The `rm` and
   `mv` shell commands are blocked in this environment, so
   `authPasswordReset.integration.tests.ts` could not be deleted or renamed. I
   overwrote its contents with the new `verifyCodeAndSetPassword` integration
   tests (no dead references remain) and kept the filename. Conservative default
   given the constraint; if you'd prefer, `git rm` it and rename the new file to
   `authService.verifyCodeAndSetPassword.integration.tests.ts` — the content moves
   verbatim.
2. **Fixed the stale shared helper `resetDb.ts`** (test file): removed
   `password_reset` (dropped in `0017`), `share_link_grant`, and `share_link`
   (both dropped in `0018`) from the `TRUNCATE` list, and added
   `email_verification` + `rate_limit_event`. The helper referenced tables that no
   longer exist, so it threw against the migrated DB and broke _every_ integration
   test at runtime. Clearly-correct schema-sync. Effect: the full integration
   suite went from 34 failing → 1 failing (the unrelated `collectionPaging` case).
3. **Fixed the stale shared helper `ensureTestViewerUsers.ts`** (test file): added
   `userStatus: 'ACTIVE'` to the seed insert. `user_status` became NOT NULL in
   migration `0019`, so the un-updated helper threw on every insert and took down
   `setupGraphqlIntegrationTests`' `beforeAll`.
4. **Added `.env` loading to `apps/api/src/tests/setup.ts`** (test file). Root
   cause: `createConfigFromEnv()` reads `process.env` directly and never loads a
   `.env` (its `ensureEnvLoaded` helper is dead — see Possible source bugs), so
   host-run Jest defaulted Postgres to `127.0.0.1:5432` while the DB is on `5433`.
   dotenv doesn't override already-set vars, so CI/explicit env still wins. Auth
   integration tests are additionally self-cleaning by email so they don't touch
   the shared reset helper.
5. **Split authService coverage across unit + integration.** The ordering /
   throw / committed-flag semantics are asserted deterministically in the unit
   test (fake uow); the real DB effects (counter-persists-across-rollback, atomic
   consume, notify-after-commit) are asserted in the integration test. Neither
   level alone covers the oracle well.
6. **Left the pre-existing `collectionPaging` integration failure and the
   pre-existing e2e `mediaViewer` typecheck error alone** — both are unrelated to
   auth and outside RAI-76 scope. Logged, not fixed.

## Possible source bugs

- **A brand-new signup persists NO user row (data-loss / broken account
  creation).** In `verifyCodeAndSetPassword` (`apps/api/src/services/authService.ts:143`)
  the new-user branch does `DomainUser.create({...}, randomUUID())`. `User.create`
  (`packages/context/media-core/src/domain/User/User.ts:23-25`) forwards that id
  into `new User(actorId, props, id)`, and the `Entity` constructor
  (`packages/context/media-core/src/domain/Entity.ts:54`) sets
  `_isNew = id == null` → **false**; `create()` also never `touch()`es, so
  `_isDirty` stays false. `persistRoot`
  (`packages/context/media-core/src/repositories/domainRepositories/AggregateRepo.ts:14-18`)
  then does **neither insert nor update** — the aggregate is silently dropped.
  The verification IS consumed (an UPDATE, which works), so the endpoint returns
  **HTTP 200 + a session cookie, consumes the code, and creates no account**. The
  user cannot log in and cannot reuse the code.
  - **Confirmed end-to-end against the running api:** seeded a known code, POSTed
    `/auth/set-password` → `200 {"message":"Operation completed successfully"}`,
    then `SELECT count(*) FROM "user"` = **0** and `email_verification.consumed_at`
    was set.
  - Contrast `PendingUser.create` (`PendingUser.ts:32-34`), which passes NO id →
    `isNew` true → persists correctly. So the shadow-user activation path is
    unaffected; only fresh signups are broken.
  - Likely fixes (for Raif — I did NOT touch source): have `User.create` not
    pass an id (mirror `PendingUser.create`), or `create()` call `touch()` /
    force `_isNew`, or make `persistRoot` treat a create()'d aggregate as new.
  - Tests encoding the correct behavior are present but `it.skip`ped: the two E6
    new-user integration cases + the two happy-path e2e cases. Un-skip once fixed.

- **Dead `ensureEnvLoaded` in `apps/api/src/config.ts` (63-71).** Defined but never
  called by `createConfigFromEnv`, so the app relies entirely on externally-injected
  env (docker-compose provides it; host-run tooling gets nothing). Minor, but it's
  why the test-setup `.env` shim (Decision 4) was needed. Not fixed (source is
  read-only).

- **Minor FE/BE reason-string mismatch (not fixed, low impact).** The set-password
  controller returns the raw `ContractError` value, e.g.
  `{"error":"INVALID_EMAIL_VERIFICATION_CODE"}`, but the web client's
  `KNOWN_REASONS` are `INVALID_CODE | EXPIRED | TOO_MANY_ATTEMPTS`
  (`apps/web/src/features/auth/authClient.ts`). The unknown string falls back to
  `INVALID_CODE`, which happens to show the right copy for the bad-code case, but
  a genuinely EXPIRED code also collapses to "That code isn't right." Cosmetic;
  noted for completeness.

## Deleted coverage

- `authPasswordReset.integration.tests.ts` (old content) — intended to cover the
  deleted password-reset flow (forgotPassword issues+emails a code; resetPassword
  validates the code, enforces attempt lockout + expiry, consumes the code,
  updates the password). That flow is deleted by design. Where the intent is
  re-covered now:
  - code validation / invalid-code rejection → E1/E3 (integration + unit) and the
    e2e bad-code test.
  - attempt lockout (`>= 3`) → E2 (integration + unit).
  - attempt-counter increment on bad code → E3 (integration asserts it _persists_
    across rollback; unit asserts the bump call ordering).
  - atomic "consume the code + set the password" → E6 existing-active-user
    (integration) and the unit ordering test.
  - code EXPIRY is now enforced by `emailVerificationRepository.getValidVerification`'s
    `expiresAt > now()` filter (a "no live row" → E1-style rejection); it is
    exercised implicitly by `authQueryService.verifyEmail` invalidation test, but
    there is **no dedicated expired-code test** at the verifyCodeAndSetPassword
    level (the old suite had one). Worth adding a seeded-expired-row E1 variant.

## Final state summary

- **Typecheck:** api ✅ exit 0, media-core ✅ exit 0. e2e has 1 pre-existing,
  unrelated error (mediaViewer spec); `signup.spec.ts` is clean.
- **Unit (api):** 29 passed / 29.
- **Integration (api, auth files):** 10 passed, 2 skipped (source bug).
  Full suite: 43 passed, 1 failed (pre-existing `collectionPaging`, unrelated),
  6 skipped.
- **E2E (signup):** 2 passed, 3 skipped (blocked by source bug / fixture work).
- **Source files modified:** none. All changes are test files.
- **Not committed** (per instructions) — working tree left for review.
