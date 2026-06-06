# Photo detail view redesign

Canonical reference for the photo detail / lightbox redesign. Layout phases (1, 1.5) established structure; Phase 2 reworked rail content.

## Locked design decisions

### Layout (Phase 1 + 1.5)

- **Stage:** `theme.color.stageDark` fills the entire detail viewport as the base layer (`Container` on `MediaItemScreen` / `PublicMediaItemScreen`).
- **Desktop:** Photo-dominant stage left; cream rail (`bodyRaised`, ~340px) right, flush to viewport edges.
- **Mobile:** Photo in dark stage at top; cream metadata **card** below (raised: border, radius, shadow, inset margins). Dark stage visible around the card.
- **Navigation:** Chevrons in stage margin (desktop); keyboard ←/→; mobile swipe. Single close in rail (desktop); stage close overlay on mobile.
- **Mobile immersive:** Single tap toggles descriptive metadata only (`isMobileMetadataVisible`). Hidden = moment/title/description/photo-details card collapses; reactions + comments stay visible below the photo. Photo size unchanged.

### Rail content order (Phase 2)

1. Close (desktop rail top-right)
2. **The moment** — `takenAt` as friendly date heading (`DATE_FULL`), no "TAKEN" label
3. Title + description
4. Reactions (heart only, names in authed view)
5. Comments (composer top, list below)
6. **Photo details** disclosure (collapsed by default)

### Copy and empty states

- No `"Not set"` / `"—"` anywhere in the rail.
- Silent absence for non-editors when fields are empty, except a quiet kind label (`Photo` / `Video`) when title is missing — anchors sparse rails.
- Sparse rail (no title, description, reactions, or comments): `Photo details` disclosure auto-expands so dimensions / file metadata fill the panel.
- Inviting prompts for editors: "Add a title", "Add a description", "Add date".
- Comments empty (authed, can comment): muted line under composer — "Be the first to say something".
- Public reactions at count 0: section omitted entirely.

### Permissions

- Inline pattern only: `mediaItem.operations.includes(Operation.editMediaItem)` and `.includes(Operation.comment)`.
- Do not use `hasPermission` from `domain/auth/helpers.ts`.
- `canReact`: authed always `true` in v1; public always `false`. No react operation gate yet.

### Editing (v1)

- Click row / prompt → `MediaItemDetailForm` (unchanged mechanism).
- Per-field inline editing is out of scope.

## Reactor data contract

Target shape (design against this; stubbed in v1):

```ts
type ReactorVM = {
  id: string;
  displayName: string;
  avatarUrl?: string;  // not rendered v1
  isViewer?: boolean;
};

// On each byEmoji entry:
type EmojiCountVM = EmojiCountFragment & {
  reactors?: ReactorVM[];
};
```

Display rules (authed, heart only):

| Reactors | Inline copy |
|----------|-------------|
| 0 | Heart button + "React with a heart" |
| 1 | ❤ Bob reacted |
| 2 | ❤ Bob and Carol reacted |
| 3+ | ❤ Bob, Carol +N reacted (N = total − 2) |

Viewer sorted first → `"You"`. Example: ❤ You, Bob +5 reacted.

**Structured formatter:** `buildReactorLine()` returns `{ inlineNames, overflowCount, allReactors }`.

**+N overflow:** `textAccent`, underline on hover, `cursor: pointer`. Desktop hover opens popover (200ms close delay). Mobile tap toggles; tap outside closes.

**Popover:** warm dark pill (`rgba(20, 15, 10, 0.85)` on rail; grid tiles keep `0.55`), 11px paper-white text, full name list (scrolls at 50+). Desktop hover opens from anywhere on the name line through `+N`. Names inline use `textAccent` + hover underline (no click v1).

**v1 stub:** `augmentWithStubReactors` in `features/media/detail/augmentWithStubReactors.ts` — delete when backend exposes `reactors` on `EmojiCount`.

**Public:** count-only ("3 people reacted"); omit section when count is 0.

## Deferred follow-ups

| Item | Notes |
|------|-------|
| GraphQL `reactors` on `EmojiCount` + resolver | Maps `actorId` → `displayName`; swap stub for real data |
| `width` / `height` on `MediaItemDetail` fragment | Authed photo details disclosure (public already has dimensions) |
| React operation / granular `canReact` | If permissions model expands |
| Reactor avatars in rail | `avatarUrl` reserved in type |
| Name tap actions (filter, profile) | Visual hint only in v1 |
| Per-field inline editing | Polish beyond form-on-click |
| Empty-state affordance polish | If dashed "Add a title" reads apologetic |

## File map

### Screens

- `apps/web/src/screens/MediaItemScreen.tsx` — authed shell, gallery nav, mobile chrome flag
- `apps/web/src/screens/PublicMediaItemScreen.tsx` — public shell

### Viewer (photo chrome only)

- `apps/web/src/features/media/viewer/MediaViewer.tsx`
- `MediaViewerDesktopNav.tsx`, `MediaViewerMobile.tsx`, `MediaViewerSingle.tsx`
- `MediaViewerStyles.tsx` — `ViewerStageDesktop`, `ViewerCard` (mobile)

### Rail / card

- `apps/web/src/features/media/MediaItemDetailPanel.tsx` — authed rail orchestration
- `apps/web/src/features/media/PublicMediaItemDetailPanel.tsx` — public rail
- `apps/web/src/features/media/detail/MediaItemDetailRailFields.tsx` — moment, title, description
- `apps/web/src/features/media/detail/MediaItemDetailRailReactions.tsx` — authed reactions
- `apps/web/src/features/media/detail/PublicMediaItemDetailRailReactions.tsx` — public reactions
- `apps/web/src/features/media/detail/PhotoDetailsDisclosure.tsx` — collapsed technical metadata
- `apps/web/src/features/media/detail/augmentWithStubReactors.ts` — **temporary**
- `apps/web/src/features/media/detail/formatReactorLine.ts` — `buildReactorLine`, `ReactorLine` type
- `apps/web/src/features/media/detail/ReactorLineDisplay.tsx` — inline names + overflow trigger
- `apps/web/src/features/media/detail/ReactorOverflowPopover.tsx` — full name list popover
- `apps/web/src/features/media/detail/reactionPopoverStyles.ts` — shared dark pill token
- `apps/web/src/features/media/MediaItemDetailForm.tsx` — edit form (unchanged flow)

### Comments

- `apps/web/src/features/comments/CommentsPanel.tsx` — `layout: 'default' | 'rail'`
- `apps/web/src/features/comments/CommentsEmptyHint.tsx` — rail empty line
- `apps/web/src/features/media/CommentsForViewerMediaItemContainer.tsx`
- `apps/web/src/features/media/PublicCommentsForMediaItemContainer.tsx`

### Types and formatters

- `apps/web/src/viewModels/reaction.ts` — `ReactorVM`, extended `EmojiCountVM` / `ReactionCountsVM`
- `apps/web/src/domain/formatters/mediaItemMetaFormat.ts` — `formatMomentHeading`, `formatDateOnly`

### Theme

- `apps/web/src/styles/theme.ts` — `stageDark: colors.gray_85`
