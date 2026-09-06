# CLAIMS.md

Every factual assertion `apps/web/public/landing.html` makes about privacy, data
handling, and the business model, extracted as a pre-ship gate.

**The rule: anything still unchecked at ship time gets cut from the page, not shipped
with fingers crossed.** Some of these are claims worth making true rather than
softening — those are marked **make-true**.

- `[x]` — verified against the codebase, with the evidence cited.
- `[ ]` — not verified, not verifiable from the repo, or contradicted.

Status as of Phase 2 (2026-09-03). Re-run this list before the Phase 5 flip.

> **Stale as of the Phase 4 copy rewrite (2026-09-05).** The page now has four sections
> (`01` Who this is for, `02` An album, not a post., `03` Your family is not AI training
> data., `04` Who made this); the `Section N — …` headings below still name the five
> pre-rewrite ones, and the Summary counts still describe the old copy. New claims are
> being filed under their nearest ancestor heading until this file is re-synced. **The
> re-sync is owed and is not done.** Claims retired by the rewrite ("No feed", "It
> doesn't matter who's on an iPhone and who isn't", "I've been building Homeroll for
> about six months") are still listed below and no longer appear on the page.
>
> **The subhead was replaced (2026-09-05) and the whole `## Subhead` section below is
> retired.** It is now _"You choose the photos, you choose who sees them, and it stays
> that way."_ Three claims went with the old line — **"scanned"**, **"profiled"** and
> **"used to train anything"** — including the one open policy commitment among them;
> the training claim itself survives on the page, but as part of section `03`, not the
> subhead. **The Google Photos comparison is also gone: the new subhead makes no claim
> about any competitor**, so nothing on the page now depends on a characterisation of
> another product's behaviour. That removes a whole class of exposure — a comparative
> claim can be falsified by the other party changing, or disputed by them — and it
> should not be reintroduced without a deliberate decision.
>
> The new subhead's own claims ("you choose who sees them", "it stays that way") are
> **not yet filed**; they land closest to the existing access-control and revocation
> entries under Section 4. File them in the re-sync.

---

## Subhead

> Like a Google Photos album, except nothing in it gets scanned, indexed, or used to
> train anything.

- [x] **"scanned"** — no content analysis of any kind exists. Grep across `apps/` and
      `packages/` for `rekognition|faceDetect|vision|tensorflow|onnx|clarifai|autoTag|classif`
      returns only `apps/web/src/application/UploadMediaItemQueue/resolveUploadFileClassification.ts`,
      which classifies a file by MIME type into image/video. It never looks at pixels.
      The media pipeline does HEIC conversion and thumbnail/display derivatives
      (`packages/context/heic-converter`, `apps/media-worker`) — transformation, not analysis.
- [x] **"profiled"** — _(Phase 3: was "indexed", which was ambiguous — photo rows are
      of course indexed in Postgres, and a technical reader who checked would find
      exactly that. "Profiled" says what was actually meant and can't be read two ways.)_
      No behavioural or advertising profile is built from photo content. No content
      analysis exists (see "scanned" above) and no third-party analytics exist (see
      "No tracking" below). See the note under Section 2 about internal
      unseen-activity rows, which are the one thing a hostile reading could reach for.
- [ ] **"used to train anything"** — no ML code exists anywhere in the repo, so the claim
      is consistent with the build. But this is a **policy commitment about the future**,
      not a property of the current code, and nothing in the repo can certify it.
      Needs a written policy to point at, or it stands on your word alone — which is
      fine, but know that's what it is.

## Micro-line

> No ads. No tracking. No feed.

- [x] **"No ads"** — no ad network, no ad slot, no ad code anywhere.
- [x] **"No tracking"** — verified in Phase 1 §9. Zero third-party scripts across
      `apps/web/src`, `index.html`, and `public/`: grep for
      `gtag|googletagmanager|plausible|posthog|sentry|fathom|umami|mixpanel|hotjar|analytics|document.cookie`
      returns nothing. No external fonts, no CDN. The only cookies set are first-party
      httpOnly functional ones: `token`
      (`apps/api/src/controllers/authController.ts:74`) and `public`
      (`apps/api/src/middleware/tokenHandshakeMiddleware.ts:24`).
      **`landing.html` itself loads zero JavaScript and makes zero external requests** —
      re-verify that property before ship, it is the load-bearing one.
- [x] **"No feed"** — no feed surface exists. Routes are library / albums / shared-albums
      (`apps/web/src/app/router/AppRouter.tsx`). Grep of the GraphQL schema for
      `follower|following|feed|publicGallery|discover` returns nothing.

---

## Section 1 — One album. Everyone who was there.

- [x] **"They add their own photos to the same album"** — contributor uploads are real:
      `AddMediaItemsToAlbum` mutation, and `AlbumMemberRole` gates write access.
      Pinned by the `contributorAddsToAlbum` e2e spec.
- [x] **"It doesn't matter who's on an iPhone and who isn't"** — web app, no native
      install path. HEIC (Apple's format) is converted server-side by
      `packages/context/heic-converter` so iPhone uploads render everywhere.
- [x] **"the people you share with don't need an account to look — they get a link that
      just works"** — the `/shared/:token` route is fully unauthenticated
      (`AppRouter.tsx:19-33` → `PublicAccessScreen` → `POST /api/auth/publicAccess`).
      No `RequireViewer`, no login.
- [x] **"And you can find it again."** — **The claim is persistence and a named album.
      It is not search, and there is no search.** Read it that way and the evidence
      supports it: albums are durable rows with a required `title`
      (`schema.graphql:101`), and both `Viewer.albums` and `Viewer.sharedWithMeAlbums`
      (`schema.graphql:1092,1102`) return sorted, paginated collections — `AlbumSortBy`
      offers `CREATED_AT` and `TITLE`. The contrast the sentence is drawing is against a
      group chat, where photos are ordered only by when they were sent and cannot be
      addressed as a group at all. A named album that is still there in two years, and
      can be sorted to, clears that bar.

      **Record the distinction, because the next reader will not re-derive it.** `Query`
          exposes exactly two fields, `publicAccess` and `viewer` (`schema.graphql:833-836`),
          and a grep of the whole generated schema for `search|filter|findBy|lookup` returns
          **nothing**. There is no text search, no date filter, no people filter, no
          free-text lookup of any kind. "Go looking for photos from a trip two years ago"
          invites a reader to picture a search box; today the honest answer is page N of a
          paginated list sorted by title or creation date.

          This is a **wording risk, not a false claim** — the sentence as written promises
          only findability, and that is true. Two things could break it: adding a search box
          to the page's implied contract by rewording the line, or letting album counts grow
          to where pagination stops being findability in practice. If search ever ships, this
          entry becomes moot. Until then, do not strengthen this sentence.

- [ ] **"If they decide they want an account later, everything they already have stays
      exactly where it is."** — **This is the riskiest unverified claim on the page, and
      it is not a policy question — it is a durability bug.** Guest-to-account grant
      materialization runs in a domain-event handler
      (`packages/context/media-core/src/domainEvents/authorizationReconciliation.ts`,
      `resolveAuthorizations.ts`). Per the root `CLAUDE.md`, domain events are published
      **post-commit, best-effort, in a try/catch that swallows failures — no outbox, no
      retry.** A swallowed failure silently locks a converted guest out of albums she
      could see five minutes earlier. The happy path is covered by
      `packages/e2e/tests/shared/guestConversion.spec.ts`; the failure path has no
      recovery at all.
      **make-true** — this is a claim worth fixing rather than softening. Until it's
      durable, the honest version drops "exactly."

## Section 2 — Your family is not training data.

- [x] **"No feed, no strangers, no algorithm deciding who your kids get shown to"** —
      as above. No feed, no recommendation code, no social graph. (This sentence is
      lifted verbatim from `apps/web/src/screens/LoggedOutScreen.tsx` and also appears
      in the welcome email, `packages/context/notifications/src/templates/welcome.tsx:35`
      — keep all three in sync if it changes.)
- [x] **"no follower count, nothing that can go viral"** — no follow/following model in
      the schema. Sharing is explicit, per-album, per-recipient.
- [ ] **"Your photos aren't scanned to build a profile of you"** — no content scanning
      (verified above) and no analytics (verified above). **But** the app does record
      per-user behavioural rows: unseen-activity tracking (`markItemsSeen`,
      `markSurfaceSeen`, the `unseen_activity` table) and rate-limit events
      (`rate_limit_event`). None of that is a marketing profile and none of it leaves
      the system — but "profile of you" is broad enough that a hostile reading could
      reach it. **Decide whether to narrow the sentence** to what you actually mean
      (no advertising or behavioural profile), which is both true and stronger.
- [ ] **"aren't sold to anyone"** — policy commitment. No data-export-to-third-party
      code exists, which is consistent, but the repo cannot certify a negative about
      your future conduct. Stands on your word.
- [ ] **"aren't used to train a model — not mine, not anybody else's"** — same as the
      subhead's training claim. Consistent with the build; unprovable from it.
      **Note the second half is a claim about third parties** (AWS S3 and SES are in the
      stack). Worth confirming your AWS terms actually say what you're implying here
      before shipping the "not anybody else's" half.

## Section 4 — How this actually works

- [x] **"Albums are private by default"** — no public-by-default flag exists. Visibility
      requires either album membership or an explicit active grant; the gate is
      `withViewableByMemberOrAlbumGrant` in
      `packages/context/media-core/src/repositories/queryHelpers/`.
- [ ] **"There's no public gallery, no discovery, and no way to browse anyone else's
      photos"** — the first two are verified (no gallery route, no discovery surface,
      nothing in the schema). **"No way to browse anyone else's photos" is an absolute
      claim about access control and deserves a dedicated audit, not a grep.** The
      architecture supports it — read repos are viewer-gated and `System*` repos are
      quarantined for viewer-less worker paths (root `CLAUDE.md`) — but note there was
      a real 403/authorization bug in this exact area recently (owner blocked from
      contributor-added item bytes, fixed via membership fallback in `authorizeView`).
      Access-control claims should be backed by an audit pass, and this is the one
      sentence on the page where being wrong is expensive.
      **make-true** — schedule the audit, then check this box.
- [x] **"you can stop sharing it whenever you want"** — real and complete.
      `RevokePublicLinkAuthentication` and `RevokeShareAuthentication` mutations exist;
      grants carry `revokedAt` and `expiresAt`, and `withActiveGrants` /
      `activeGrantChecks` enforce both on every read.
- [x] **"Nothing gets scanned to sort it, tag it, or figure out who's in it"** — no
      auto-tagging, no face detection, no classification (verified above). `updateMediaItemTags`
      exists but is **user-entered**, which is what the sentence means by contrast.
- [ ] **"I'm not selling anything on the side"** — personal/business fact, outside the
      repo. Only you can check this one.
- [ ] **"it costs money to store them, so eventually it'll cost money to store them, and
      that'll be the whole business model"** — **forward-looking commitment with no
      current implementation.** There is no billing code, no plan model, no paid tier,
      no free-tier quota anywhere in the schema. The brief's own note applies: _adjust
      to whatever's actually true about free tier vs. paid; don't promise free forever._
      The sentence as written doesn't promise free forever — it promises the _opposite_,
      which is safer — but it does commit you publicly to never monetising another way.
      Ship it only if you mean it as a constraint on yourself.

## Section 5 — Who made this

- [x] **"I'm one person"** — `git log` shows a single author across all 498 commits:
      `Raif Harik <harik.raif@gmail.com>`.
      **Note the conflict:** `apps/web/src/screens/LoggedOutScreen.tsx:356-359` currently
      ships _"We're a small team who think your family's photos are nobody else's
      business."_ That page is one click from the landing. The landing says "I'm one
      person"; the login page says "we're a small team." **One of them has to change**,
      and per brief §5 it should be the login page. Out of scope for Phase 2 — flagged
      here so it can't be forgotten.
- [x] **"I've been building Homeroll for about six months"** — matches the repo.
      First commit `2026-02-23`, most recent `2026-09-03`. _(Phase 3: was "about a
      year", which the history contradicted. On a page whose entire argument is "check
      what I'm telling you," an easily-checked overstatement was the worst kind of
      error available; the verifiable number is also the more specific one.)_
- [ ] **"There's no investor waiting on a return, no growth target"** — personal fact,
      outside the repo. Only you can check it.
- [ ] **"no acquisition that ends with your albums somewhere you didn't pick"** —
      forward-looking commitment. Unverifiable by nature.
- [ ] **"If I ever can't keep running it, I'll tell you, and I'll give you a way to take
      everything with you."** — **there is no export path. None.** The full mutation list
      in `apps/api/src/graphql/generated/schema.graphql` contains no export, download-all,
      takeout, or archive operation. Individual originals are reachable one at a time via
      `/media/:mediaId/original` (`MediaAssetKind.original`), but there is no way to take
      an album — let alone everything — out of the system.

      **DECIDED (Phase 3): keep the sentence and build the feature.** This is now a
          committed deliverable, not an open question. The brief's gate — *only ship the
          last sentence if you mean it* — is answered "I mean it."

          **This box stays unchecked, and this claim blocks ship, until export exists.**
          Sketch of what that means: a bulk album (and whole-account) export. It fetches
          originals from S3, so it belongs in `apps/media-worker` as a task rather than in a
          request — see the nested `apps/media-worker/CLAUDE.md` for the task-runner and
          `QueueClaimable` patterns. Delivery is probably a signed URL to a generated
          archive, mailed via the existing notification path.
          **make-true**

---

## Photographs

Not a claim the copy makes, but a ship gate the page cannot pass without, and it
belongs on the same checklist because it fails the same way — quietly, and only
after publication.

- [ ] **Every identifiable person in the final photograph set has said yes.**
      Brief §6.1 makes this a hard gate: _"it must be real photos of real people who
      said yes. Not stock."_ The page argues that your family is not a data source;
      illustrating it with someone's face that nobody cleared would refute the
      argument in the most literal way available, and it would do so permanently —
      the photographs are the first thing a reader sees.
      The current set is **placeholder** (`apps/web/landing-source/`) and contains
      roughly fifteen identifiable people across three frames, including a baby.
      Consent is owed for whatever set actually ships, not for these.
      **This box is per-photograph and resets on every swap.**
      If permission can't be obtained, brief §6.1's fallback is type only, no
      images — explicitly _not_ stock.

## Summary

|                                                      | Count                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Verified                                             | 13                                                                     |
| Unverified / policy-only                             | 8                                                                      |
| Contradicted by the repo                             | 0                                                                      |
| **make-true** (committed to building, not softening) | **3** — export path, guest-conversion durability, access-control audit |
| **Non-copy ship gates**                              | **1** — photograph consent (resets on every photo swap)                |

**Resolved in Phase 3:**

- "indexed" → "profiled" in the subhead. Precision fix; now verified.
- "about a year" → "about six months". Now matches the repo.

**Still blocking ship — all three are build work, not copy work:**

1. **Export path.** Decided: keep the sentence, build the feature. Until it exists the
   page promises something the product cannot do.
2. **Guest-conversion durability.** "Everything stays exactly where it is" rides a
   best-effort event bus that swallows failures.
3. **Access-control audit.** "No way to browse anyone else's photos" is an absolute
   claim and needs a real pass, not a grep.

Nothing on the page is now knowingly false. What remains is three promises that are
true in intent and not yet true in code — which is exactly the list this file exists
to keep visible.
