# Zeta Theme Migration — Dark → Warm Light

## What changed

**Two files: `colors.ts` and `theme.ts`.** Drop-in replacements. The semantic
token API (`theme.color.body`, `theme.color.bodyText`, `theme.color.link`,
etc.) is unchanged in shape — only the values resolve to different colors.
Most components should keep rendering without modification.

### Design intent

A warm, paper-like light theme. Cream-tinted neutrals (not clinical white)
paired with a clay accent for character. An editorial serif (`font.serif`)
is now available for wordmarks and section headers. The whole palette is
tuned for AA contrast against the paper background.

### Specific decisions

- **Renamed `amber` → `clay`.** The previous "amber" was being repurposed as
  the warm-light accent; the name was misleading. The new clay
  (`#AA5C39`) is slightly darker than the mockup hex (`#B86A45`) to pass
  AA contrast as a primary button background.
- **Gray scale convention inverted.** Previously `gray_10` was the darkest
  value (app background in dark mode). Now `gray_10` is the lightest (paper
  white). Mental model: lower number = closer to background, higher number =
  closer to text. The semantic token mappings (`body: gray_10`, `bodyText:
  gray_90`) didn't change — the values they point to did.
- **All neutrals carry a subtle warm tint.** Yellow/orange hue at low
  saturation. Avoids the "clinical lab" feeling of pure gray on cream.
- **Box shadows softened.** Previous `rgba(0,0,0, 0.3–0.5)` was tuned for
  dark surfaces. New shadows use a warm-dark tint (`rgba(58, 42, 28, ...)`)
  at much lower alpha (0.06–0.10). Shadows now feel like part of the
  palette, not a cool hole punched in it.
- **Avatars re-pointed.** Previously used `_darker` variants chosen for
  dark backgrounds. Now use the base of each color family — saturated
  enough to be distinct, dark enough that paper-white avatar text passes
  AA on all six.
- **Added `font.serif`.** System stack: Iowan Old Style → Charter →
  Hoefler Text → Cambria → Georgia. Zero perf cost. Looks good on
  macOS, Windows, and most Linux. If you want a signature webfont later
  (e.g., GT Sectra, Tiempos, Source Serif), add it ahead of Iowan in the
  stack.
- **Added font sizes `_13` and `_17`.** Used for nav items (13px) and
  wordmark (17px) in the new design. Other sizes unchanged.
- **Primary button uses `clay_dark`, not `clay`.** Filled clay button with
  paper-white text was 3.8:1 (below AA 4.5:1). Clay_dark is 5.3:1. The
  base clay is still used elsewhere as foreground text where it sits on
  paper.
- **Alert tints + text pairs guaranteed AA.** Each `_lightest` background
  pairs with its `_darker` text for ≥6:1 contrast.

## What to spot-check in the rest of the codebase

The semantic token layer protects most components from the change, but
five patterns will likely need adjustment somewhere:

### 1. Hardcoded `rgba(255, 255, 255, ...)`

Used in dark themes for hover overlays and subtle highlights. On light
surfaces, these are invisible — flip to `rgba(0, 0, 0, ...)` or use a
warm-dark tint like `rgba(58, 42, 28, ...)` at low alpha.

```bash
git grep -n "rgba(255, 255, 255" apps/web
```

### 2. Hardcoded `#fff` / `#ffffff` / `'white'`

In the dark theme, these usually meant "primary text on dark surface."
On light, they're now backwards — they'll render as invisible white
text on cream. Most of these should be `theme.color.bodyText` or
`theme.color.gray_90`.

```bash
git grep -nE "(#fff[^a-fA-F0-9]|#ffffff|color:\\s*['\"]?white)" apps/web
```

### 3. References to `theme.color.amber*` or `colors.amber*`

The primitive was renamed to `clay`. Find-and-replace:

```bash
git grep -n "\\.amber" apps/web
```

`theme.color.amber` → `theme.color.clay`
`colors.amber_dark` → `colors.clay_dark`
etc.

### 4. Heavy `box-shadow` values

Anything with `rgba(0, 0, 0, 0.2)` or stronger will look bruised on the
cream background. Use `theme.boxShadow.sm/md/lg` if at all possible, or
soften manually.

```bash
git grep -nE "box-shadow.*rgba\\(0, ?0, ?0, ?0\\.[2-9]" apps/web
```

### 5. Card/panel components

Previously, cards (`bodyRaised`, `cardBg`) were *lighter* than the body
(`bodyText`) on a dark theme. Now they're *also light* — the visual
relationship between body and card is much subtler. If a card used to
stand out by being a few shades brighter than the page, it now barely
differs. Decide whether you want:
- **No card chrome** (recommended, matches the new design — let
  whitespace and typography do the structural work)
- **Subtle 0.5px border** (`border: 0.5px solid theme.color.gray_30`)
- **Slight tint** (`background: theme.color.gray_15` instead of body)

The `bodyRaised`, `bodyElevated`, and `cardBg` tokens are still
distinct values, but the visual gap between them is now ~3–5% lightness
instead of the 10–15% gap they had on dark.

## Tokens worth knowing for the new components

When building the redesigned library grid, selection state, etc., reach
for these specifically:

| Use                              | Token                       |
|----------------------------------|-----------------------------|
| Page background                  | `body`                      |
| Section header text (the clay-colored one) | `textAccent` |
| Section subtitle ("June 4 · workshop")     | `textMuted`  |
| Selected photo ring              | `primaryButtonBg` (clay_dark) |
| Selected photo checkmark badge bg | `primaryButtonBg`          |
| Checkmark icon color             | `primaryButtonText`         |
| Unselected hollow circle border  | `rgba(255, 255, 255, 0.9)` on top of photo (white-on-image, not theme color) |
| Selection toolbar bg             | `bodyRaised`                |
| Share button (primary)           | `primaryButtonBg` / `primaryButtonText` |
| Add to album / text actions      | `ghostButtonText`           |
| Cancel link                      | `textMuted`                 |
| Wordmark "Harik family"          | `font.serif`, `bodyText`, `fontSize._17` |

## Things deferred

- **Dark mode.** Out of scope. When you add it, the cleanest path is to
  wrap this file in a `makeTheme(mode: 'light' | 'dark')` factory that
  picks different `colors.ts` exports based on mode. The semantic token
  layer doesn't need to change.
- **Webfont serif.** System stack is good for v1. If you want a
  signature, GT Sectra (paid), Tiempos (paid), Fraunces (free, Google
  Fonts), or Source Serif (free, Adobe) all suit this aesthetic. Add
  ahead of `Iowan Old Style` in the stack.
- **Removing legacy aliases.** `theme.colors.*`, `theme.radius.*`,
  `theme.shadow.*`, and the `...colors` spread in `theme.color` are all
  retained for backward compat. Audit and remove once nothing reaches
  for them.
- **Per-family-member avatar assignment.** The six avatar colors are
  defined but the assignment logic (which family member gets which
  color) belongs in a hook, not the theme. Suggested: hash the user ID
  modulo 6.
