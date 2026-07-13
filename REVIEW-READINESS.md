# Release-Readiness — Phase 1 Coverage Audit (READ-ONLY)

Scope: auth (signup/verify/set-password/login/verifyEmail), `verifyCodeAndSetPassword`
transaction semantics, pending/shadow-user flow, mixed-recipient share, `getOrCreateAllUsers`.
No source or tests changed. Findings only.

**Test inventory (changed surface):**

| Level       | File                                                               | What it covers                                                                     |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| unit        | `apps/api/src/tests/authService.verifyCodeAndSetPassword.tests.ts` | E1–E4, E6, notify/rollback ordering (mocked)                                       |
| unit        | `apps/api/src/tests/authController.tests.ts`                       | login / logout / emailVerification / setPassword / me / publicAccess (mocked deps) |
| integration | `apps/api/src/tests/authPasswordReset.integration.tests.ts`        | E1–E4 + E6 active-user reset (real PG); **E6 new-user = 2 tests `.skip`**          |
| integration | `apps/api/src/tests/authQueryService.integration.tests.ts`         | login ok/badpw/unknown; verifyEmail store + invalidate-prior                       |
| integration | `apps/api/src/tests/graphql.shareLink.integration.tests.ts`        | **entire suite `describe.skip`**                                                   |
| e2e         | `packages/e2e/tests/auth/signup.spec.ts`                           | email step, bad code, happy path, bad-then-good, pending-user activation           |
| e2e         | `packages/e2e/tests/shared/shareItemsWithNonUser.spec.ts`          | share 2 items → non-user → anon sees via public link                               |
| e2e         | `packages/e2e/tests/shared/shareAlbumWithNonUser.spec.ts`          | share album → non-user; add/remove item reflects; contact suggestion               |
| e2e         | `packages/e2e/tests/shared/shareItemsWithUser.spec.ts`             | share items → active user; unseen dot; comments; email fired                       |
| e2e         | `packages/e2e/tests/shared/shareAlbumWithUser.spec.ts`             | share album → active user; add/remove; unseen dot; email                           |
| e2e         | `packages/e2e/tests/shared/shareItemsWithUserEnter.spec.ts`        | recipient Enter-commit → pill render only                                          |

---

## 1. Auth — signup / login / verifyEmail / token

|                |                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Exists**     | signup.spec.ts (e2e, 5 tests); authController.tests.ts (unit); authQueryService.integration.tests.ts (login+verifyEmail)  |
| **Happy path** | **Yes** — e2e drives email→code→password→logged-in; login integration returns user+token; verifyEmail persists a live row |

**Failure modes:**

| Case                                                                        | Covered | Where                                                                                           |
| --------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| invalid code rejected, stays on step                                        | Yes     | signup.spec `an invalid code is rejected`                                                       |
| bad-then-correct code                                                       | Yes     | signup.spec `bad code then correct code`                                                        |
| login wrong password → undefined                                            | Yes     | authQueryService integration                                                                    |
| login unknown user → undefined                                              | Yes     | authQueryService integration                                                                    |
| login returns user with `passwordHash` stripped                             | Yes     | authQueryService integration                                                                    |
| verifyEmail invalidates prior live code                                     | Yes     | authQueryService integration                                                                    |
| login rate-limit (5/15min)                                                  | Partial | authController unit only (mocked); no integration                                               |
| emailVerification existence-blindness (blind 200, invalid email, throttled) | Yes     | authController unit                                                                             |
| **new signup persists user as ACTIVE with usable password**                 | **NO**  | E6 new-user integration is `.skip` — see §5 finding B1                                          |
| token/JWT actually authenticates a later request                            | No      | token asserted as a non-empty string only; never round-tripped through `/me` or an authed query |

**Judgment: REASONABLE for login/verifyEmail. GAP for new-user signup** — the one path
every new account takes has no active assertion on the persisted row (§5 B1).

---

## 2. `verifyCodeAndSetPassword` transaction semantics (E1–E6)

|                |                                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| **Exists**     | Unit oracle (all paths) + integration oracle (real PG, E1–E4 + active-user E6)  |
| **Happy path** | Unit **yes**; integration active-user **yes**; integration **new-user `.skip`** |

**Exit paths:**

| Path                                                                                     | Unit                              | Integration                                    |
| ---------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------- |
| E1 no verification row → reject + rollback, nothing persisted                            | Yes                               | Yes                                            |
| E2 attemptCount≥3 lockout → reject, **counter NOT bumped**, nothing persisted            | Yes                               | Yes                                            |
| E3 bad code → reject, **attempt bump persists across rollback** (autocommit outside uow) | Yes (`order:['bump','rollback']`) | Yes (asserts `attemptCount===1` post-rollback) |
| E4 pending activate() fails → rollback, not consumed, stays PENDING/no-pw                | Yes                               | Yes                                            |
| E5 success = save+consume atomic in one committed uow                                    | Yes (order oracle)                | active-user: Yes; **new-user: `.skip`**        |
| E6 notify AFTER commit; notify failure doesn't roll back committed write                 | Yes (result-fail + rejection)     | active-user: Yes; **new-user: `.skip`**        |
| pre-commit throw → rollback + rethrow                                                    | Yes                               | —                                              |

The E3 "counter survives rollback" is the subtle one and is genuinely asserted at the DB
level — good. The `committed`-flag guard (post-commit notify throw must not roll back) is
covered at both levels.

**Judgment: REASONABLE and unusually thorough for the transaction mechanics** — except the
new-user branch, whose DB assertions are skipped behind a stale comment (§5 B1).

---

## 3. Pending / shadow-user flow

|                |                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exists**     | signup.spec `pending-user activation materializes…`; shareItemsWithNonUser; shareAlbumWithNonUser                                                                                     |
| **Happy path** | **Yes** — share item to non-user email → shadow user + public-link album + grant → sign up same email → item appears in Shared Items (via post-commit `pendingUserActivated` handler) |

**Failure / edge modes:**

| Case                                                                | Covered         | Note                                                                        |
| ------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------- |
| non-user share mints public link + emails it                        | Yes             | both non-user specs poll SES for the invite URL                             |
| anon can view only the shared items, not siblings                   | Yes             | asserts sibling tiles absent                                                |
| album membership changes reflect on public link (add/remove)        | Yes             | shareAlbumWithNonUser                                                       |
| pending activation flips PENDING→ACTIVE and materializes item grant | Yes (read side) | signup.spec; **but asserted via UI tile only, not the `access_grant` row**  |
| `pendingUserActivated` event actually emitted on activation         | Indirect        | inferred from the item appearing; no direct assertion the event/handler ran |
| shadow user re-shared same item twice (idempotency)                 | No              |                                                                             |
| activation of a shadow user who has grants across multiple sharers  | No              | single-sharer only                                                          |
| pending user who never activates (expiry / cleanup)                 | No              |                                                                             |

**Judgment: REASONABLE for the primary flow** (it's the marquee scenario and is driven
end-to-end). Thin on grant-row shape and multi-sharer fan-out.

---

## 4. Mixed recipients / `getOrCreateAllUsers`

|                |                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exists**     | Only indirect: single-recipient e2e specs. **No unit/integration test targets `getOrCreateAllUsers`, `inviteUsersForMediaItems`, or the `PartialShareFailure` guard.** |
| **Happy path** | single active recipient: Yes (e2e). single non-user: Yes (e2e). **mixed (active + non-user in one call): NO**                                                          |

**Failure / edge modes (all at the service level — the correct level for these):**

| Case                                                                                                                    | Covered                                    | Note                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| mixed recipients: some active (item grants) + some non-user (public-link album) in one call                             | **No**                                     | the newest, most complex branch in `grantAuthorizationForMediaItems` (§source) — public-link album built _and_ per-user item grants in the same uow |
| email normalization (trim + lowercase)                                                                                  | No (indirectly via pill lowercasing in UI) | `getOrCreateAllUsers` normalizes; untested directly                                                                                                 |
| duplicate emails in one share deduped                                                                                   | No                                         | `[...new Set(...)]` — untested                                                                                                                      |
| all-or-nothing on `PartialShareFailure` (one item/recipient fails → whole op rolls back, **no** partial grants persist) | **No**                                     | `grantAuthorizationForMediaItems.ts:161` — silent-partial-share guard, untested                                                                     |
| `getOrCreateAllUsers` all-or-nothing failure surfacing (one `createUser` fails → whole result fails)                    | No                                         | `Promise.all` + `.find(!success)` — untested                                                                                                        |
| empty recipient list                                                                                                    | No                                         | `getOrCreateAllUsers([])` → `ok([])` → no grants; untested                                                                                          |
| empty item list                                                                                                         | Yes (guard)                                | `dedupedIds.length===0 → DeleteMediaItemsEmptyList` — reachable, but no test asserts it                                                             |
| **sharing an item you don't own**                                                                                       | **No**                                     | `ensureMediaItemOwnedByViewer` gate — security-relevant, zero coverage                                                                              |
| revoked / expired grant read-side filtering                                                                             | Partial                                    | shareAlbumWithNonUser removes an item and asserts it 404s on the public link (album-membership path); no test for a `revokedAt`/`expiresAt` grant   |
| concurrent share to same new email                                                                                      | No                                         | see §5 B2 — the dedup guard that _should_ prevent a duplicate shadow user is dead code                                                              |

**Judgment: GAP.** The composite/mixed path and the all-or-nothing guard — the two things
most likely to silently corrupt grant state — have no coverage at any level.

---

## 5. Tests that look WEAK, and likely source bugs they mask

### Weak tests (pass even if the write did the wrong thing)

- **W1 — signup happy-path e2e asserts UI, not DB.** `signup.spec.ts` happy path checks only
  that the `Recent` nav link renders (`expectLoggedIn`). It never reads the `user` row. The
  set-password controller sets the JWT cookie _directly_ from the returned token, so the app
  shows "logged in" **regardless of the persisted user's status**. This test would pass even
  though the user is persisted as `PENDING` (see B1) — it actively masks that bug.
- **W2 — share e2e specs assert only tile visibility, never `access_grant` rows.** None of the
  5 share specs check grant shape (item-scoped vs album-scoped, `operation`, `grantedToUser`,
  `revokedAt`). The read path is exercised (good), but a grant written with the wrong
  scope/operation that still happens to render would pass.
- **W3 — pending-activation e2e infers the grant from a tile.** `signup.spec` pending test
  asserts the item tile appears in `/shared/items`; it never asserts the item-scoped
  `access_grant` was actually materialized. The comment claims the grant is materialized on
  activation, but the assertion can't distinguish that from any other read path.
- **W4 — item-share email assertion is recipient-match only.** `shareItemsWithUser.spec`
  acknowledges (TODO) it can't tell the item-share template from any other email to that
  user; it only asserts _an_ email arrived.
- **W5 — token never round-tripped.** Auth tests assert the JWT is a non-empty string but
  never use it to authenticate a subsequent request, so "token verification" is effectively
  untested end-to-end.

### Likely source bugs surfaced while auditing (NOT fixed — Phase 1)

- **B1 — brand-new signup persists the user as `PENDING`, never `ACTIVE`.**
  `authService.ts:142-147` (the `!user` branch) calls `PendingUser.create({…, passwordHash}, randomUUID())`,
  which sets `userStatus: UserStatus.pending` (`PendingUser.ts:32-34`) and **never calls
  `.activate()`**. So a first-time signup that verified its code and set a password is written
  with `userStatus = PENDING` and emits **no `pendingUserActivated` event**. The two E6
  new-user integration tests that would catch this (`authPasswordReset.integration.tests.ts:272,301`)
  are `.skip`-ped — and their skip comment is **stale**: it blames the old
  `DomainUser.create` id-forwarding bug (already fixed — `User` no longer even has a `create`),
  but the tests would still fail today for a _different_ reason (status `PENDING`, not `ACTIVE`).
  Masked by W1. **Highest-priority item.** (Needs a quick confirm of whether login/read-gating
  rejects `PENDING` users; if it does, new accounts are broken on next real login.)
- **B2 — `CreateUserWriteService` "user already exists" guard is dead code.**
  `createUserWriteService.ts:45-47`: `if (existingUser) { fail(ContractError.UserAlreadyExists); }`
  — the `fail(...)` is not `return`ed, so the guard does nothing and the code proceeds to
  create + save a second `PendingUser`. Normally unreachable (upstream `getOrCreateAllUsers`
  filters existing users first), but a **concurrent share to the same new email** would create
  duplicate shadow users. No test exercises it.
- **B3 — leftover `console.dir(user, …)` debug line** at `authService.ts:141` runs on every
  set-password call (logs user PII to stdout). Not a test issue; flagging for cleanup.

---

## Prioritized gaps — if shipping soon

Ranked by (likelihood × blast-radius).

### Worth a test before release

1. **New-user signup persists ACTIVE + usable password (un-skip / rewrite E6 new-user).**
   _Every_ new account takes this path; B1 makes it likely wrong today, and W1 hides it.
   Assert the persisted `user` row: `userStatus === ACTIVE`, `bcrypt.compare(password, hash)`,
   verification `consumedAt` set, notify fired post-commit. This is the single highest
   likelihood×blast item. (Integration level — `authPasswordReset.integration.tests.ts`.)
2. **Mixed-recipient share (active + non-user in one call).** Newest, most complex branch;
   builds a public-link album _and_ per-user item grants in the same uow; zero coverage.
   Assert both grant kinds persist and the active user vs. shadow user each resolve their
   items. (Integration on `grantAuthorizationForMediaItems`, or e2e.)
3. **All-or-nothing on partial failure (`PartialShareFailure`).** If one item/recipient fails,
   the whole op must roll back with _no_ grant rows left behind. Silent partial shares leak
   access or lie "shared!". (Integration — force one grant to fail, assert `access_grant`
   count is 0 for the batch.)
4. **Share an item you don't own is rejected.** Security-relevant auth gate
   (`ensureMediaItemOwnedByViewer`) with no coverage. Cheap to add. (Integration or e2e.)

### Nice-to-have later

- `getOrCreateAllUsers` unit test: normalization (case/trim), dedup, all-or-nothing failure
  surfacing, empty list.
- Un-skip / rebuild `graphql.shareLink.integration.tests.ts` — the public share-link
  resolution query has zero active coverage (the suite predates the grants-from-events
  refactor, which is likely why it's skipped).
- Add a DB `access_grant`-shape assertion to one existing non-user share e2e (upgrade W2/W3
  in place rather than a new file).
- Concurrent-share-to-same-new-email (guards against B2 duplicate shadow users).
- Round-trip the signup JWT through an authed request (closes W5).

---

**STOP — Phase 1 complete. Awaiting selection of which gaps to close before Phase 2.**
Note: items 1–4 above intersect likely source bugs B1/B2. Per the Phase 2 rule, a test that
reveals a real bug will be committed as `.skip` with a `// RAI:` note rather than having its
source "fixed" to make it pass.

---

---

# Phase 2 — Hardening results

Scope approved: all four gap sets (new-user E6, `getOrCreateAllUsers` unit, partial-share
rollback, mixed-recipient + ownership) + source cleanup. B1 was fixed by the repo owner
(added the `user.activate()` call to the new-user path). The two share tests initially
surfaced real bugs and were committed `.skip` with `// RAI: bug` notes (I did not edit source
to make them pass); the owner then fixed both bugs, so those tests are now **un-skipped and
passing** as regression guards. See "Bugs found during hardening" below.

## Source cleanup (done)

- Removed `console.dir(user, {getters:true})` PII dump — `authService.ts` (was line 141). _(B3)_
- Removed the commented-out `publicAccess` block + `console.log('FU')` and its dead interface
  member — `authQueryService.ts`.

## Tests added / changed

| Test                                                                      | Level       | File                                                                       | Status                                             |
| ------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| new-user E6 success (ACTIVE + password + consumed + notify-after-commit)  | integration | `authPasswordReset.integration.tests.ts`                                   | **un-skipped, passes** (B1 fix confirmed)          |
| new-user E6 notify-rejection post-commit                                  | integration | `authPasswordReset.integration.tests.ts`                                   | **un-skipped, passes**                             |
| `getOrCreateAllUsers`: normalize / dedup / all-or-nothing / merge / empty | unit        | `packages/context/media-core/src/tests/getOrCreateAllUsers.tests.ts` (new) | **6 pass**                                         |
| share item you don't own → rejected, no grant rows                        | integration | `graphql.shareGrants.integration.tests.ts` (new)                           | **passes**                                         |
| mixed recipients (active + non-user) in one call                          | integration | `graphql.shareGrants.integration.tests.ts` (new)                           | **passes** (bug #1 fixed — now a regression guard) |
| partial-share all-or-nothing rollback                                     | integration | `graphql.shareGrants.integration.tests.ts` (new)                           | **passes** (bug #2 fixed — now a regression guard) |

Verification (against local Postgres on :5443): api unit **29 pass**; media-core unit
**49 pass** (incl. the 6 new); api integration **49 pass, 4 skip, 0 fail** (3 of 4 full-suite
runs clean; one run flaked in the unrelated `deleteFlows` suite — a known shared-pool race,
14/14 in isolation). B1 fix directly confirmed — the new-user E6 tests show the
`pendingUserActivated` event firing and the row persisted `ACTIVE`.

## Bugs found during hardening — both since FIXED by the repo owner (verified)

Reported first as `.skip` + `// RAI: bug` per the Phase 2 rule; the owner then implemented
fixes, and the two tests are now **un-skipped and passing** as regression guards.

- **RAI bug #1 (FIXED) — sharing one media item with >1 recipient in a single call crashed.**
  `grantAuthorizationForMediaItems.ts` saved the item aggregate **once per authorization**,
  so an item shared with N recipients issued N concurrent `save`s of the same aggregate,
  each re-inserting the same rows → `duplicate key ... "access_grant_pkey"`. The e2e specs
  only share with a single recipient (each item saved once), which is why it hid.
  **Fix:** de-dupe the authorized media-item ids (`new Set(...map(mediaItemId))`) and save
  each distinct item once (`grantAuthorizationForMediaItems.ts:130-138`). Verified: a mixed
  2-item / 2-recipient share now commits 5 grants (2 item grants for the active user, 2 for
  the shadow user, 1 tokenized public-link grant) with no crash.

- **RAI bug #2 (FIXED) — `PartialShareFailure` did not roll back; partial grants committed.**
  The service returns `fail(PartialShareFailure)` _after_ the successful grants are written;
  the resolver surfaces that as a `success:false` **data payload**, not a GraphQL error, so
  the old `useScopedContainer` commit predicate (`!result.errors?.length`) committed anyway.
  **Fix:** a per-request `uow.shouldRollback` flag — `authenticatedWriteResolver` now detects
  a fail-as-data result (`success:false` or non-empty `errors[]`) and sets it, and
  `useScopedContainer` commits only if `!result.errors?.length && !uow.shouldRollback`
  (`unitOfWork.ts`, `contextWrappers.ts`, `useScopedContainer.ts`, `types.ts`). Verified: a
  partial share now returns `PARTIAL_SHARE_FAILURE` **and** leaves zero `access_grant` rows.
  Note: this is a broad boundary change — _every_ mutation returning a failed WriteResult now
  rolls back its uow. The full integration suite stays green under it, but it's worth a
  focused eye in review since it changes commit semantics for all write mutations.

- **Test-infra gap (fixed) — integration tests ran a stale `media-core` build.**
  `apps/api`'s DI composed manifest imports factories via the `@packages/media-core/iocManifest`
  - `/iocTypes` subpaths, whose package `exports` resolve to the built **`dist`**, while the
    main `@packages/media-core` entry is jest-mapped to **source**. `test-integration` has no
    `dependsOn: build` and there's no CI build-before-integration, so the container silently
    ran whatever `dist` existed — a stale one here, which **masked both bugs above** (the stale
    build behaved differently). Fixed the integration harness to map the two DI subpaths to
    source too (`jest.integration.config.js`), so the suite always exercises current
    `media-core` source. Full integration suite re-run green (47 pass) after the change.

## Still-open items from Phase 1 (not in approved scope)

- **B2** (`CreateUserWriteService` dead `UserAlreadyExists` guard, missing `return`) — the
  new `getOrCreateAllUsers` unit test covers the common-path dedup/normalization that keeps
  duplicate shadow users from being minted, but the concurrent-share race that B2 exposes is
  still untested and unfixed.
- **Operation enum mismatch** (surfaced while writing the share tests): the GraphQL/DB
  `Operation` enum lists `VIEW`, but the domain `Operation` smart-enum
  (`contracts/src/enums/operation.ts`) has no `view` member — passing `VIEW` throws
  "No enum value found for 'VIEW'". The client only ever sends `DOWNLOAD`/`COMMENT`, so this
  is latent, but the schema advertises an operation the domain can't accept.
- `graphql.shareLink.integration.tests.ts` remains fully `describe.skip` (out of scope).
