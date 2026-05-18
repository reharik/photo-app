# Architecture Decision Log

---

## #001 · Media — MediaAsset is NOT a domain entity

**Status:** decided · **Date:** 2026-04-29

**Decision:** MediaAsset is infrastructure, not domain. S3 paths are derived by convention (thumbnail/display/original). The DB table stays for operational reasons (orphan cleanup, migrations), but the domain only knows about MediaItem.

**Rationale:** The app never makes decisions based on individual asset attributes. The 1→3 relationship is fixed and invariant. Loading 4 extra tables on every MediaItem read is wasted work.

**Alternatives:** Keep MediaAsset as AR — rejected because it bloats every read for a one-time write concern.

---

## #002 · Media — MediaItem creation uses a domain service, not the AR

**Status:** decided · **Date:** 2026-04-29

**Decision:** S3 uploads and asset row creation happen in a domain service or application service, not on the MediaItem aggregate. The AR stays clean of asset knowledge.

**Rationale:** Assets only matter at creation time. After that they're inert. Pushing creation into a service keeps the AR's read path lean.

**Alternatives:** Event-based (MediaItemCreated → handler writes assets) — viable but overkill for now. AR owns assets — rejected, pollutes every load.

---

## #003 · Sharing — Every public link is an album

**Status:** decided · **Date:** 2026-04-29

**Decision:** Share links are album-only. No union type, no loose item sharing. Sharing a single item auto-creates a hidden album. PublicAccess has `album: PublicAlbum!`, no union.

**Rationale:** The union approach (PublicAlbum | PublicMediaItem) required too much deduction and paging was unclear. Album-only gives dead simple paging (reuse album item paging) and a clean schema.

**Alternatives:** Union type with dynamic grant aggregation — rejected, ugly SQL and reimplements album paging. Virtual/ephemeral albums constructed on the fly — rejected, neither clean nor worth the complexity.

---

## #004 · Sharing — Single item shares get a hidden album

**Status:** decided · **Date:** 2026-04-29

**Decision:** When sharing a single media item, auto-create a hidden album (`hidden` boolean on album table), skip the naming dialog, go straight to share dialog. Hidden albums are filtered from album list queries.

**Rationale:** Small conceptual awkwardness but keeps the schema dead simple. The alternative (dynamic item collections) was way worse.

**Alternatives:** Don't support single item sharing — too restrictive. Dynamic collections from grants — ugly SQL, reimplements paging.

---

## #005 · Sharing — Multi-item share flow prompts for album name

**Status:** decided · **Date:** 2026-04-29

**Decision:** Select items → click Share → dialog asks for album name → creates album → shows share dialog with link. One extra step but intentional — user ends up with a real named album in their library.

**Rationale:** Feels natural, avoids mystery ephemeral objects, keeps the model honest.

**Alternatives:** Auto-name everything — loses intentionality.

---

## #006 · Authorization — access_grant.albumId is provenance, not scope

**Status:** decided · **Date:** 2026-04-29

**Decision:** `albumId` on `access_grant` tracks WHERE the grant originated (for revocation/lifecycle), NOT what it grants access to. Same for `share_link` — both carry `albumId` for the same reason.

**Rationale:** Unsharing an album = find all grants where `albumId = X`, revoke them. Without provenance you'd have to trace back through share links or do ugly inference.

**Alternatives:** Remove `albumId` from grant — rejected, lose the ability to cleanly revoke by album.

---

## #007 · Authorization — Permissions CSV lives on grant, not access_grant

**Status:** decided · **Date:** 2026-04-29

**Decision:** The permissions CSV (e.g. `'download'`, `'reshare'`) lives on the grant row — the per-item read model. Each grant points at one media item and carries the additional operations the viewer can perform. View is implicit (see #023).

**Rationale:** A user can have multiple grants for the same item from different sources (direct share with download + album share with view-only). Effective operations = union across all active grants for that item. Putting the CSV on grant means each per-item record carries its own capabilities and the union just works. Putting it on `access_grant` would force identical permissions across all items in the grant.

**Alternatives:** Permissions on `access_grant` — rejected, forces identical permissions on all items. Permissions on a separate `access_grant_item` table — rejected, we don't have one in the actual schema; grant IS the per-item record.

---

## #008 · Authorization — access_grant is the lifecycle container

**Status:** decided · **Date:** 2026-04-29

**Decision:** The `access_grant` governs lifecycle — who, when, revocable as a unit. The grant rows point to assets and list what you can do. Revoking an `access_grant` cascades to delete its grant rows.

**Rationale:** Clean separation: `access_grant` = the reason you have access (lifecycle envelope), grants = the per-item specifics. Different sharing actions create different `access_grant`s with independent lifecycles.

**Alternatives:** Flat permission rows without a grouping container — rejected, no way to atomically revoke a sharing action.

---

## #009 · Authorization — Three-table sharing model

**Status:** decided · **Date:** 2026-04-29

**Decision:** `share_link` (token, expiry, revocation, no perms) → `access_grant` (lifecycle envelope: who, when, why; `share_link_id` OR `userId`, no perms) → `grant` (per-item read model: viewer, `mediaItemId`, `accessGrantId`, permissions CSV). Migration 0019 collapsed the previous `share_link_grant` join table.

**Rationale:** `share_link` owns the credential, `access_grant` owns lifecycle and provenance, `grant` is the fast read-side projection. Three tables, three jobs, no overlap.

**Alternatives:** `share_link_grant` as a join table — rejected via migration 0019, was unnecessary indirection. Two tables with direct FK — too coupled.

---

## #010 · Authorization — Grant table is infrastructure, not domain

**Status:** decided · **Date:** 2026-04-29

**Decision:** The grant table is a read model for fast S3 serving checks. It's populated as a side effect of domain writes (add member, share item). Not part of any AR. Hot path is a single indexed lookup.

**Rationale:** It answers "can this HTTP request serve this byte" — a query/infrastructure concern. The domain doesn't enforce invariants based on it. Regenerating it from source-of-truth domain state is always possible.

**Alternatives:** Put grants on the AR — rejected, it's a read optimization not domain state.

---

## #011 · Authorization — Authorization checks are explicit in service layer (Ayende pattern)

**Status:** decided · **Date:** 2026-04-29

**Decision:** No authorization framework. Explicit checks at each operation point in the service layer with full business context. Inspired by Ayende's Rhino Security conclusion.

**Rationale:** Authorization decisions need business context (ownership, role, album membership). Infrastructure-level auth can't express "can this user share this specific item given their relationship to it." Explicit beats implicit.

**Alternatives:** Rhino Security style framework with permission/group/ranking tables — rejected, massive overkill and obscures business logic in data.

---

## #012 · Authorization — Roles and capabilities model

**Status:** decided · **Date:** 2026-04-29

**Decision:** Album members have roles (owner, admin, contributor — NO viewer role). Roles map to capabilities in code, not in DB. Check capabilities (`member.role.can(op)`), not roles directly. Share recipients get view/download only via grants, not album membership.

**Rationale:** Viewer role was doing the same job as a share but with more complexity. Capabilities in code means adding operations is a code change, not a migration. Role-to-capability mapping lives in one place.

**Alternatives:** Viewer role on `album_member` — rejected, redundant with shares. Permissions in DB tables — rejected, overkill.

---

## #013 · Authorization — Share permission rules

**Status:** decided · **Date:** 2026-04-29

**Decision:** Share a media item → must own it. Share an album → must own or admin the album. Share recipients cannot reshare. Contributing to an album implies consent for the album owner to share it.

**Rationale:** Simple, defensible, no unbounded sharing chains. The implicit consent on contributions keeps the model from getting tangled.

**Alternatives:** Allow resharing — rejected, creates unbounded chains. Allow contributors to share — rejected, complicates permission model.

---

## #014 · Authorization — Soft delete for access_grant, hard delete for grant

**Status:** decided · **Date:** 2026-04-29

**Decision:** Revoking sets `revoked_at` on `access_grant` (audit trail preserved). Grant rows are hard deleted (read model cleanup). `access_grant_id` FK on grant with CASCADE for revocation.

**Rationale:** Audit trail on grants, clean read model. CASCADE handles the common case of revoking the `access_grant`.

**Alternatives:** Hard delete everything — loses audit trail. Soft delete everything — stale read model rows.

---

## #015 · Structure — File structure grouped by domain

**Status:** decided · **Date:** 2026-04-29

**Decision:** `writeServices` grouped by domain (`album/`, `mediaItem/`, `authorization/`, `publicLink/`). `readServices` split into `viewerReadServices/` (bound to `viewerId`) and `publicReadServices/` (bound to `shareLinkId`). Repositories stay flat. Cross-domain writes use explicit imports.

**Rationale:** Flat buckets lose context. Domain grouping makes the folder the context. Cross-domain dependencies become visible imports rather than hidden in a flat list.

**Alternatives:** Flat everything — rejected, noisy and context-free. Full domain modules — overkill for current size.

---

## #016 · Structure — Naming: keep access_grant, not authorization

**Status:** decided · **Date:** 2026-04-29

**Decision:** Keep table name `access_grant`. Don't rename to `authorization` — it's overloaded (authn vs authz, OAuth, RBAC). `access_grant` is more specific and descriptive.

**Rationale:** You read `access_grant` and know what it is. "Authorization" means different things in different contexts.

**Alternatives:** Rename to `authorization` — rejected, too overloaded. Note: code-level folders DO use `authorization/` for grouping write services, which is fine as a category name.

---

## #017 · Query — Operations pattern for per-item permissions

**Status:** decided · **Date:** 2026-04-29

**Decision:** `operations` is an array of enum strings (`SHARE`, `DELETE`, `DOWNLOAD`, etc.) on `MediaItem` and `AlbumItem`. Resolved via `getPermissionsForViewer` in bulk at list resolver level, mapped from `Map<mediaItemId, operations[]>`. NOT a field resolver (avoids N+1).

**Rationale:** The frontend needs to know which actions to render per item (kebab menu). Bulk resolution avoids N+1. Only added to list queries that back action-capable UIs.

**Alternatives:** Per-item field resolver — rejected, N+1. Separate permissions endpoint — rejected, extra round trip.

---

## #018 · Sharing — Google Photos model validates our approach

**Status:** decided · **Date:** 2026-04-29

**Decision:** Google Photos shared albums support comments, likes, and collaboration — but only for authenticated Google account holders. Anonymous link viewers can look but not interact. This validates album-only sharing with permission-gated features.

**Rationale:** Confirmed that the industry standard is: album is the shared object, auth boundary controls what you can do. Comments/likes are a future capability added to `grant.permissions`, not a v1 concern.

**Alternatives:** Stripped-down gallery view only — still possible, but the model supports both without changes.

---

## #019 · General — Comments are NOT in v1 scope

**Status:** decided · **Date:** 2026-04-29

**Decision:** Don't build comments in zeta. Build the sharing and permissions model correctly. Comments become a permission added to `grant.permissions` later. The model doesn't change either way.

**Rationale:** Product decision (option A: view-only peasants vs option B: grandma comments) doesn't need to be made yet. The grant permissions CSV supports both futures.

**Alternatives:** Build comments now — rejected, premature product decision with significant surface area (identity, moderation, spam).

---

## #020 · Authorization — Album share paints all items with the same brush

**Status:** decided · **Date:** 2026-04-30

**Decision:** When an album is shared, the share permissions apply uniformly to all items. Contributors don't get per-item permission overrides. Contributing to an album is implicit consent for the owner to control how it's shared.

**Rationale:** Per-item contributor overrides would be a significant complexity jump (override logic, UI for contributors to set per-item permissions, conflict resolution between contributor intent and owner intent). The grant permissions structure supports per-item permissions if we ever need it — the UI and override logic would be the new work, not the schema.

**Alternatives:** Contributors retain per-item permission control — deferred, not rejected. Revisit if contributors actually complain. The data model supports it without changes.

---

## #021 · Authorization — Album member exists to hold a role, and that's fine

**Status:** decided · **Date:** 2026-04-30

**Decision:** Album membership is a named, revocable relationship (owner/admin/contributor) whose mechanical output is a set of `Operations`. It's not redundant with authorization — authorization governs read access (can you see this), membership governs write capabilities (can you modify this). Different lifecycles, different concerns.

**Rationale:** Collapsing membership into authorization would lose the role as an indirection. Roles survive product evolution — adding a new operation is a code change in the role-to-capabilities mapping, not a data migration across existing grants. Removing a member cleanly revokes write capabilities without touching their view access from separate shares.

**Alternatives:** Put operations directly on authorization — rejected, brittle. Changing what "contributor" means becomes a data migration instead of a one-line code change.

---

## #022 · Query — Operations resolution: two functions, same output shape

**Status:** decided · **Date:** 2026-04-30

**Decision:** `resolveAlbumOperations(album, viewer)` and `resolveItemOperations(item, viewer)` both return `Operation[]`. Album ops come from ownership + membership role. Item ops come from ownership + album membership + grant permissions. Different sources, same shape, same consumer.

**Rationale:** The consumer (kebab menu, toolbar) doesn't care where the permission came from. Centralizing resolution into two functions keeps the complexity contained instead of scattered across resolvers and services.

**Alternatives:** Unified resolution function — rejected, album and item operations have different source logic. Per-source resolution — rejected, pushes complexity to the consumer.

---

## #023 · Authorization — View is the implicit baseline of the grant table

**Status:** decided · **Date:** 2026-05-06

**Decision:** A grant row's existence means the viewer can view the item. The permissions CSV expresses ONLY ADDITIONAL operations beyond view (e.g. `'download'`, never `'view,download'`). At the S3 hot path, no CSV parsing happens — existence check is enough. The CSV only matters when resolving `operations` for UI.

**Rationale:** Preserves the "grant exists → fast yes" property of the read model. Avoids redundant `csv.includes('view')` checks. Matches reality: there's no meaningful "downloadable but not viewable" state. View is the floor; everything else is strict addition.

**Alternatives:** Include `'view'` explicitly in the CSV — rejected, redundant noise and creates the question "what if it's missing?" One grant per operation (separate rows for view, download, etc.) — rejected, explodes row count and gains nothing since revocation already happens at `access_grant` level.

---

## #024 · Database — Surrogate UUID primary keys on every table

**Status:** decided · **Date:** 2026-05-12

**Decision:** Every table uses a surrogate UUID `id` column as the primary key, regardless of whether the table has a natural composite key. When a natural key exists (e.g. reaction's `(target_type, target_id, user_id, emoji)` tuple), it is expressed as a UNIQUE constraint, not a composite primary key.

**Rationale:** Convention uniformity outweighs the storage savings of a composite PK. A surrogate UUID PK on every table means: (a) every domain entity has a consistent `id` field with no special-casing, (b) repositories use the same insert/update/delete patterns, (c) downstream features (joins, listing, audit trails, references from other tables) work uniformly. Composite PKs force concessions in the entity layer (synthetic id derivation), the repository layer (custom INSERTs), and downstream code. The savings — one UUID column — is trivial compared to the cost of the special case rippling through the stack.

**Alternatives:** Composite primary key on tables with natural composite keys — rejected because it breaks convention uniformity and forces downstream layers to handle the special case. The natural-key invariant is preserved via UNIQUE constraints, which behave identically for ON CONFLICT and uniqueness enforcement.
