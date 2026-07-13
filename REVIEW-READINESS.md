# Release-Readiness — Coverage Audit (Phase 1, read-only)

Scope: auth + sharing + pending-user work on `main` (diff vs `HEAD~4`).
Verdict up top: **transaction semantics of `verifyCodeAndSetPassword` are genuinely
well covered; the sharing / grant / pending-user write path is almost entirely
e2e-only and has real gaps.** The single most important signup happy-path
assertion (new-user is persisted correctly) is currently `.skip`'d behind a stale
comment, and the source it guards looks buggy.

Test inventory considered:

- Unit: `authService.verifyCodeAndSetPassword.tests.ts`, `authController.tests.ts`, `tokenVerifier.tests.ts`
- Integration (real Postgres): `authPasswordReset.integration.tests.ts` (repurposed → verifyCodeAndSetPassword), `authQueryService.integration.tests.ts`, `graphql.yoga.integration.test.ts`
- e2e (Playwright + LocalStack SES): `auth/signup.spec.ts`, `shared/shareItems*`, `shared/shareAlbum*`, `public/publicLink*`

---

## Area 1 — Auth core (signup → verify → setPassword → logged in; login; verifyEmail; token verification)

| Sub-area | Tests that exist | Happy path | Failure modes | Judgment |
|---|---|---|---|---|
| **login** | `authQueryService.integration` (correct creds → user+token, passwordHash stripped; wrong pw → undefined; unknown user → undefined); `authController.tests` (missing fields → 400, rate-limit → 400, invalid → 401, success sets cookie) | **Yes** (integ, real DB) | good pw / bad pw / unknown user ✓. **Not covered:** login while `userStatus = PENDING` (see Area 1 note — login does **not** gate on status, `authQueryService.ts:55`), locked/rate-limit at the query layer (only controller-mocked). | **Reasonable** for login itself. |
| **verifyEmail (issue code)** | `authQueryService.integration` (stores fresh live row; issuing a 2nd invalidates the 1st live code); `authController.tests` (invalid email → generic 200 no issue, rate-limited → generic 200, valid → issues, email normalized/trimmed) | **Yes** | invalidate-prior-live ✓, existence-blind response ✓, rate-limit (controller-mocked) ✓. **Not covered:** the SES send is fire-and-forget (`void notificationService.notify`, `authQueryService.ts:116`) — a notify throw is neither awaited nor observed anywhere. | **Reasonable.** |
| **token verification** | `tokenVerifier.tests` (valid→user; expired / malformed / wrong-secret → undefined; valid-but-user-gone → undefined) | **Yes** | expiry / tamper / wrong secret / dangling user ✓. Pure unit with a stub knex — adequate for JWT logic. | **Reasonable.** |
| **full signup flow** | `signup.spec.ts` e2e: email→code step; bad code stays on step; happy path lands in app; bad-then-good code logs in; pending-user activation surfaces shared item | Happy path **Yes** (e2e) | bad code ✓, bad-then-good ✓, rate-limit reset handled in fixture. **Not covered by any assertion:** that the created user row is persisted with the **correct status/password** (e2e only checks the "Recent" nav is visible; the JWT cookie is minted regardless of persisted status). | **THIN** — see Gap #1. |

> **Note (Area 1):** `login` authenticates on email + `passwordHash` only and never
> checks `userStatus`. Combined with the new-user path leaving status = PENDING
> (Gap #1), a fully-signed-up account is `PENDING` in the DB yet can log in. Not a
> login blocker, but nothing asserts the intended end state.

---

## Area 2 — `verifyCodeAndSetPassword` transaction semantics (E1–E6)

| Exit path | Unit (`.verifyCodeAndSetPassword.tests`) | Integration (`authPasswordReset.integration`) | Judgment |
|---|---|---|---|
| **E1** no verification row → reject, rollback, no save/bump | ✓ | ✓ (asserts no user row, no notify) | Reasonable |
| **E2** attemptCount ≥ 3 lockout → reject, no bump, no consume | ✓ | ✓ (asserts counter still 3, not consumed, no user) | Reasonable |
| **E3** bad code → reject **+ counter bump persists OUTSIDE the uow across rollback** | ✓ (order oracle `['bump','rollback']`) | ✓ (**seeds attemptCount 0, asserts 1 after rollback** — proves the autocommit gateway survives) | **Strong** — this is the subtle one and it's genuinely verified at the DB. |
| **E4** pending `activate()` fails → rollback, not consumed, stays pending, no password | ✓ | ✓ (asserts status still PENDING, passwordHash null, not consumed) | Reasonable |
| **E5** success = atomic save + consume | ✓ unit (new user); ✓ integ **active-user reset only** (pw updated, verification consumed). **NEW-user success integ is `.skip`'d.** | Partial — see Gap #1 | **GAP** for new-user |
| **E6** notify AFTER commit; committed flag stops post-commit throw rolling back | ✓ unit (order `['save','consume','commit','notify']`; notify-result-fail still ok; notify-throw doesn't rollback); ✓ integ active-user (observes committed+consumed state at notify time) | ✓ active-user; new-user `.skip`'d | Reasonable except new-user |

**Judgment:** the ordering/atomicity/rollback contract is covered about as well as it
can be — unit proves ordering via a call-order oracle, integration proves the
counter-persists-across-rollback and notify-after-commit with real committed reads.
The only hole is the **new-user success path at the integration level** (Gap #1).

---

## Area 3 — Pending-user / shadow-user flow

| Aspect | Tests that exist | Covered? | Judgment |
|---|---|---|---|
| share item with non-user → shadow user + shadow album + public link + item grant | `signup.spec` "pending-user activation…" (e2e, full cycle: share → sign up → item appears in Shared Items); `shareItemsWithNonUser.spec` (share → SES link → anon page shows items) | Happy path **Yes** (e2e) | Reasonable-ish |
| convert pending → active materializes grants | `signup.spec` pending test (polls `/shared/items` until tile visible) | **Yes** (e2e, read-side) | Reasonable |
| share album with non-user → public link | `shareAlbumWithNonUser.spec` (share → link → items visible; add/remove item reflects; contact suggestion saved) | **Yes** (e2e) | Reasonable |
| **DB-level effects** (pending `user` row w/ status PENDING, `access_grant` scope = item vs album, `share_contact` rows, public-link token row) | **none** — no share/pending spec touches the DB except cleanup | **No** | **THIN** — all verification is read-model-via-UI; nothing asserts the grant *scope*, token, or that the shadow user is actually `PENDING`. |
| activation event handler (`pendingUserActivated` → AuthorizationReconciliation) materializing grants **in isolation** | none (only observed end-to-end through the e2e) | **No** (unit/integration) | Acceptable if e2e stays green; brittle single point of coverage. |

**Failure modes that *should* exist and don't:** activation when the pending user
has **no** pending grants (no-op path); activation racing the post-commit async
handler (the e2e already needs a 20s poll — that lag is real); a pending user who
signs up with an invalid phone (E4 covers rollback, but not that grants are left
intact for a retry).

**Judgment: THIN.** The happy path is covered end-to-end, but entirely through the
UI read model. No test would catch a grant written at the wrong scope as long as
the item still renders.

---

## Area 4 — Share with mixed recipients (some active, some non-user, one call)

| Aspect | Tests that exist | Covered? | Judgment |
|---|---|---|---|
| single active recipient | `shareItemsWithUser`, `shareItemsWithUserEnter`, `shareAlbumWithUser` | Yes (e2e) | — |
| single non-user recipient | `shareItemsWithNonUser`, `shareAlbumWithNonUser` | Yes (e2e) | — |
| **mixed active + non-user in one share** | **none** | **No** | **GAP** |

This is the branch with the most moving parts and **zero** coverage:
`grantAuthorizationForMediaItems.ts` splits `users` into `pendingUsers` (→ builds a
public-link album, `invitePendingUsers`, `PublicLinkSharedWithUser` events) and
active users (→ per-item `UserAuthorization` + `mediaItemsSharedWithUser` events),
then collects **both** event sets into one uow (`:133`). Nothing exercises both
branches firing in the same transaction. **Judgment: GAP that matters** (Gap #3).

---

## Area 5 — `getOrCreateAllUsers` (normalization, dedup, all-or-nothing failure)

| Behavior (`inviteUsersService.ts:19`) | Tests that exist | Covered? | Judgment |
|---|---|---|---|
| normalize: `trim().toLowerCase()` on every handle | **none** | **No** | GAP |
| dedup: `new Set(...)` so `A@x.com`, `a@x.com`, ` a@x.com ` collapse to one user/grant | **none** | **No** | GAP |
| all-or-nothing: `Promise.all` of `createUserWriteService`, first failure short-circuits `fail(failure.error)` | **none** | **No** | GAP |
| existing + new merge returns both | only implicitly via e2e single-recipient | Partial | THIN |

**Judgment: GAP.** This is pure, cheap-to-test logic that is also security-adjacent:
normalization is what stops `Bob@x.com` and `bob@x.com` from minting two shadow
users / two grants, and dedup stops a duplicate email in one share from double-
granting. None of it is asserted anywhere. A unit test over this function is the
highest value-per-line test on the board.

---

## Prioritized gaps — "if shipping soon"

Ranked by (likelihood × blast-radius).

### Worth a test before release

1. **New-user signup persists the WRONG user state — and the test that would catch it is `.skip`'d.**
   `authPasswordReset.integration.tests.ts:272` & `:301` are skipped citing a
   *stale* reason (the comment says `authService.ts:143` calls `DomainUser.create(...,
   randomUUID())`; it actually calls **`PendingUser.create(...)`** now, and never
   calls `activate()`). Result: a brand-new signup is saved with **`userStatus =
   PENDING`** and is never activated. `login` doesn't gate on status so the e2e still
   goes green, which is exactly why this slipped. **Un-skip these two integration
   tests** (fix the oracle to the intended end state first — see "Possible bugs").
   This is the primary signup happy-path DB assertion and it is currently not
   running. *Likelihood: certain (code path runs on every real signup). Blast: every
   new account.*

2. **`getOrCreateAllUsers` unit test** — normalization + dedup + all-or-nothing.
   Cheap, pure, no DB. Guards against case-variant duplicate shadow users and
   double-grants. *Likelihood: high (any share with a duplicate/case-variant email).
   Blast: duplicate users/grants, hard to unwind.*

3. **Partial-share all-or-nothing rollback** — `grantAuthorizationForMediaItems.ts:161`
   returns `PartialShareFailure` and rolls the whole uow back when any per-item grant
   fails. This guard is brand-new, explicitly there to stop a silent "shared!" lie,
   and has **no** test. Needs an integration test: force one item in a multi-item /
   multi-recipient batch to fail and assert **no** grant rows were committed (not just
   the response code). *Likelihood: medium. Blast: silent data-integrity lie — the
   worst failure class.*

4. **Mixed-recipient share** (active + non-user in one call) — integration or e2e.
   The dual-branch event collection at `:133` is untested. *Likelihood: medium (real
   users share with mixed lists). Blast: pending grants or active grants silently
   dropped.*

### Nice-to-have later

- Sharing an item you don't own — the ownership guard exists
  (`grantAuthorizationForMediaItems.ts:72`, `ensureMediaItemOwnedByViewer`) but is
  untested. Low likelihood via the UI, but it's the authz boundary.
- Grant **revoke / expiry** visibility (recipient loses access when `revokedAt` set
  or `expiresAt` passes) — the query fragments (`withActiveGrants`) enforce it; no
  test drives it.
- Empty recipient list → the code returns `DeleteMediaItemsEmptyList` for empty
  entity list but recipient-empty isn't asserted.
- Concurrent share to the same new email (two shadow-user creates racing) — real but
  low-frequency; the unique constraint / dedup behavior is unverified.
- `verifyEmail` fire-and-forget SES failure handling.

**Deliberately NOT recommending:** exhaustive per-operation grant matrices, every
email-case permutation at e2e level, or duplicating the E1–E6 unit coverage at
integration. The transaction semantics are already well covered.

---

## Separately flagged — tests that look WEAK (pass without proving the effect)

1. **`authPasswordReset.integration` E6 new-user — `.skip`'d with a stale reason
   (`:272`, `:301`).** A skipped test asserting the correct oracle reads as "known
   bug, parked," but the comment describes code that no longer exists. This is the
   most misleading item in the suite: it looks like coverage, runs as zero.

2. **All share e2e specs assert the UI read-model only — never the persisted rows.**
   `shareItemsWithNonUser`, `shareItemsWithUser`, `shareAlbum*` verify "the tile is
   visible" / "an email arrived," but none assert `access_grant` scope (item vs
   album), `revokedAt`/`expiresAt`, `share_contact`, or the shadow user's status. A
   grant written at the wrong scope, or an over-broad grant, passes every one of them
   as long as the item still renders. (Reasonable *as e2e* — the read model reflects
   the write — but there is **no** lower-level test making the DB-state assertion, so
   the guarantee is entirely "did the page render.")

3. **`shareItemsWithUser` email assertion is a bare recipient match** (`:53-67`) — the
   test itself flags the weakness: `TODO: tighten the match to the item-share
   template's distinctive copy`. It would pass on *any* email to User B, including an
   unrelated one.

4. **`authController.setPassword` success test** (`authController.tests.ts:229`)
   asserts 200 + cookie set, but `authService` is mocked, so nothing at the
   controller boundary proves the cookie'd token corresponds to a persisted, usable
   account. Fine as a unit test — noted only because #1 means nothing *else* closes
   that loop for the new-user path.

---

## Possible source bugs surfaced during the audit (not fixed — Phase 1 is read-only)

- **New user left PENDING / never activated.** `authService.ts:142-147` creates a
  `PendingUser` for a brand-new signup and never calls `activate()`, so the row
  persists with `userStatus = PENDING` and the "welcome" path never flips it active.
  Either the source should activate a genuinely-new user, or the E6 oracle (which
  expects `ACTIVE`) is wrong — needs a product decision before un-skipping Gap #1.
- **Debug artifact left in a hot path.** `authService.ts:141`:
  `console.dir(user, { depth: null, getters: true })` runs on **every**
  `verifyCodeAndSetPassword` call and dumps the full user aggregate (incl. PII) to
  stdout. Remove before release.
- Commented-out `publicAccess` + `console.log('FU')` block in `authQueryService.ts:128-156`
  — dead code, cosmetic, worth deleting.

---

**STOP — Phase 1 complete. No source or tests changed. Awaiting your selection of
which gaps to close in Phase 2.**
