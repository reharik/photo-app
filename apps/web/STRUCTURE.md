# Project Structure Guide

## Overview

The project follows a layered architecture where each folder has a clear, single purpose. Here's how to decide where a file goes.

## Directory Map

```
src/
├── styles/              ← Design tokens. Never imports from anywhere else in src.
│   ├── colors.ts            Primitive color palette (raw hex values)
│   ├── theme.ts             Semantic tokens mapped from primitives
│   ├── globalStyle.ts       CSS reset + base typography
│   └── styled.d.ts          TypeScript module augmentation
│
├── ui/                  ← Pure presentational primitives. No data fetching, no routing.
│   ├── Primitives.tsx       Layout (HStack, VStack, Spacer) + atoms (Card, Button, Badge, Table)
│   ├── FormInput.tsx        Polymorphic form field (input/select/textarea + label + error)
│   ├── Text.tsx             Typography components (H1–H4, P1–P3, Caption, etc.)
│   ├── LoadingDots.tsx      Three-dot pulse animation
│   ├── StatusMessage.tsx    Inline success/error/warning/info feedback
│   ├── AppModal.tsx         Generic modal backdrop + dialog chrome
│   ├── ConfirmationModal.tsx  Modal with confirm/cancel actions
│   ├── Toast.tsx            Auto-dismissing notification bar
│   ├── PageSpinner.tsx      Full-width loading spinner
│   ├── AppErrorPanel.tsx    Validation error list panel
│   ├── AppErrorInline.tsx   Single-line error display
│   ├── QueryErrorState.tsx  Error + retry for failed data fetches
│   ├── EmptyState.tsx       "Nothing here yet" placeholder
│   └── index.ts             Barrel export
│
├── app/                 ← App bootstrap. Wiring only — providers, router, auth guard.
│   ├── providers/
│   │   └── AppProviders.tsx    ThemeProvider, ApolloProvider, QueryClientProvider
│   ├── router/
│   │   └── AppRouter.tsx       Route definitions
│   └── ViewerBootstrap.tsx     Auth gate — resolves viewer or shows logged-out
│
├── screens/             ← Route-level components. Each maps 1:1 to a route.
│   │                       Owns: data fetching (useQuery), mutation orchestration,
│   │                       modal open/close state, and composing features into a page.
│   ├── HomeScreen.tsx
│   ├── AlbumScreen.tsx
│   ├── AlbumsListScreen.tsx
│   ├── MediaItemScreen.tsx
│   ├── SharedWithMeScreen.tsx
│   └── LoggedOutScreen.tsx
│
├── features/            ← Domain-specific composed UI. These are the "sections" and
│   │                       "panels" that screens assemble. They may fetch data or
│   │                       receive it as props — the key distinction from ui/ is
│   │                       that they know about domain concepts (albums, media, sharing).
│   ├── albums/
│   │   ├── AlbumSection.tsx
│   │   ├── AlbumListSection.tsx
│   │   ├── AlbumSectionMetadata.tsx
│   │   ├── CreateAlbumModal.tsx
│   │   └── PublicAlbumSection.tsx
│   ├── media/
│   │   ├── RecentMediaSection.tsx
│   │   ├── MediaItemDetailPanel.tsx
│   │   ├── MediaItemDetailForm.tsx
│   │   ├── UploadMediaButton.tsx
│   │   └── viewer/
│   │       ├── MediaViewer.tsx
│   │       ├── MediaViewerSingle.tsx
│   │       ├── MediaViewerDesktopNav.tsx
│   │       ├── MediaViewerMobileNav.tsx
│   │       ├── MediaViewerStyles.tsx
│   │       ├── MediaRenderer.tsx
│   │       ├── ImageRenderer.tsx
│   │       ├── ZoomableImageViewport.tsx
│   │       └── mediaViewerTypes.ts
│   ├── gallery/
│   │   ├── AddItemsToAlbum.tsx
│   │   ├── InfiniteScroll.tsx
│   │   ├── mediaItemGalleryNavigation.ts
│   │   ├── NeighborDisplayPrefetch.tsx
│   │   └── useNeighborDetailPrefetch.ts
│   ├── sharing/
│   │   ├── GrantShareForm.tsx
│   │   ├── GrantAlbumShareModal.tsx
│   │   ├── GrantMediaItemShareModal.tsx
│   │   ├── SharePermissionSelect.tsx
│   │   ├── ShareRecipientInput.tsx
│   │   └── ShareTokenResult.tsx
│   ├── shared-with-me/
│   │   └── SharedWithMeSection.tsx
│   └── shell/
│       ├── AppShell.tsx
│       ├── Navigation.tsx
│       └── Profile.tsx
│
├── hooks/               ← Reusable React hooks (not domain-specific).
│   ├── useMediaQuery.ts
│   ├── useMediaSwipeNavigation.ts
│   ├── useMediaViewerKeyboard.ts
│   ├── useMultiSelectGallery.ts
│   ├── useMultiSelectIds.ts
│   ├── useUploadQueue.tsx
│   └── apiFetch/
│       └── useApiFetch.ts
│
├── graphql/             ← GraphQL schema, operations, and generated types.
│   ├── client.ts
│   ├── generated/
│   ├── mutations/
│   └── queries/
│
├── application/         ← Pure business logic. No React, no UI.
│   ├── auth/
│   ├── errors/
│   ├── graphql/
│   ├── media/
│   └── viewer/
│
├── viewModels/          ← Transform raw API data into screen-ready shapes.
│   ├── album/
│   ├── media/
│   ├── publicAlbum/
│   ├── publicMedia/
│   └── sharing/
│
├── lib/                 ← Pure utility functions (formatters, URL builders).
│   ├── formatters/
│   ├── urlBuilders/
│   └── viewerOps.ts
│
├── contexts/            ← React contexts (AuthContext).
│
├── types/               ← Shared TypeScript types.
│
└── config.ts            ← Environment configuration.
```

## Decision Rules

**"Where does this file go?"**

1. **Does it render UI but know nothing about albums/media/sharing?** → `ui/`
2. **Does it compose domain-aware UI (albums, media, etc.)?** → `features/{domain}/`
3. **Is it a route-level page that wires everything together?** → `screens/`
4. **Is it a React hook with no domain coupling?** → `hooks/`
5. **Is it pure logic with no React?** → `application/`
6. **Does it transform API data into a view model?** → `viewModels/`
7. **Is it a formatting/URL utility?** → `lib/`

## What Changed from the Previous Structure

The main change is splitting `shared/components/` — which was a grab-bag — into two clear layers:

- **`ui/`** — Generic, reusable, domain-agnostic (modals, errors, spinners, toasts)
- **`features/`** — Domain-specific composed components, grouped by feature area

The old `shared/components/ui/` contents moved into `ui/`. The old `shared/components/{Section}` files moved into `features/`. Screen-specific helpers like `MediaItemDetailForm`, `CreateAlbumModal`, and the share modals also moved into their respective feature folders since they're domain components, not screens.

The `shared/components/dataAccess/` utilities (`getQueryRenderState`, `useAppMutation`) moved to `hooks/` since they're reusable hooks.
