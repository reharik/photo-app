# apps/web — CLAUDE.md

React/Vite frontend. See [root CLAUDE.md](../../CLAUDE.md) for the codegen chain and
smart-enums; this file is FE-specific.

## Theme tokens + styled-components

Three layers — **never skip one, never hardcode a color in a component**.

1. `src/styles/colors.ts` — primitive palette (raw hex). **Do not import directly
   from components** (the file says so). Scales: `base, _light, _lighter, _lightest,
   _dark, _darker, _darkest`; neutrals are a numbered gray scale (`gray_10` lightest →
   `gray_90` primary text).
2. `src/styles/theme.ts` — maps primitives to **semantic tokens** under
   `theme.color.*` (e.g. `theme.color.primaryButtonBg`, `theme.color.textMuted`).
   This is what components consume.
3. `src/styles/styled.d.ts` — augments styled-components' `DefaultTheme` so the tokens
   are typed.

Consumption is always `${({ theme }) => theme.color.<token>}` inside `styled`
templates. **Rule confirmed by the codebase: zero hex literals in `.ts`/`.tsx`
outside `src/styles/` and `/generated/`.** New code: prefer `theme.weight.medium`
over `semi`/`bold`. Spacing is `theme.spacing(n)` = `n*8px`.

**Avoid these legacy escape hatches** (they work but are marked for removal):
- `theme.color` spreads `...colors`, so `theme.color.gray_50` resolves — but that's
  the "primitive escape hatch (legacy — avoid in new code)".
- `theme.colors.*` / `theme.radius.*` / `theme.shadow.*` are backward-compat aliases.
  New code uses `theme.color.*` (singular), `theme.borderRadius.*`, `theme.boxShadow.*`.

## GraphQL

- `.graphql` files live **only** in `src/graphql/` (`queries/`, `mutations/`) — none
  under `src/features/**`. Codegen scans `src/graphql/**/*.graphql` (`codegen.yml`).
- Output: `src/graphql/generated/` — `types.ts`, `graphql-smart-enum-type-policies.ts`,
  and the **`schema.graphql` snapshot** (copied from the API by `nx sync-schema web` —
  don't hand-edit it; see root codegen chain).
- **No generated `useXHook` wrappers.** Codegen emits a `TypedDocumentNode` per
  operation: `<OperationName>Document` (and `<FragmentName>FragmentDoc`). Import these
  from `../../graphql/generated/types` and pass them to raw Apollo hooks:
  ```ts
  import { ViewerAlbumsDocument } from '../graphql/generated/types';
  useQuery(ViewerAlbumsDocument, { ... });
  client.mutate({ mutation: CreateAlbumDocument, ... });
  ```
- Enums come from `@packages/contracts`; scalars: `DateTime`/`Date` → `luxon#DateTime`,
  `UUID` → `string`. Compose fragments via spreads, defined alongside in `queries/`.

## Structure

- `src/screens/` — top-level routed pages, `*Screen.tsx`, one per route, wired in
  `src/app/router/AppRouter.tsx`. Public-route variants in `src/screens/public/`.
- `src/features/` — reusable feature modules by domain (`albums`, `media`, `sharing`,
  `comments`, `shell`, …). Screens compose these. Data-fetching happens in both
  screens and feature containers.
