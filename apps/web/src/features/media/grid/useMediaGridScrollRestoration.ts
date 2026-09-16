import type { WatchQueryFetchPolicy } from '@apollo/client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type MouseEvent,
  type RefObject,
} from 'react';
import { NavigationType, useNavigationType } from 'react-router-dom';
import type { PagingState } from '../../../hooks/getPaginatedQueryRenderState';

const STORAGE_PREFIX = 'homeroll:media-grid-scroll:';

/**
 * Restoration keys, shared by the screen (fetch-policy decision) and the section
 * (MediaGrid prop) so both address the same saved entry.
 */
export const mediaGridRestorationKeys = {
  library: 'library',
  album: (albumId: string): string => `album:${albumId}`,
  publicAlbum: (token: string): string => `public-album:${token}`,
};

/** Attribute on each grid item carrying its media id; used to save and to find the tile. */
export const MEDIA_GRID_ITEM_ID_ATTR = 'data-media-grid-item-id';

type SavedGridPosition = {
  mediaId: string;
  /** Fallback only, used when the tile can't be found after every page is loaded. */
  scrollTop: number;
};

const storageKeyFor = (restorationKey: string): string => `${STORAGE_PREFIX}${restorationKey}`;

const writeSaved = (restorationKey: string, value: SavedGridPosition): void => {
  try {
    sessionStorage.setItem(storageKeyFor(restorationKey), JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode / quota) — restoration is best-effort.
  }
};

/**
 * Reads the saved position WITHOUT consuming it. The screen calls this during its first
 * render (fetch-policy decision); the grid hook consumes the entry later, in a layout
 * effect. Parent render always precedes child effects, so the two never race.
 */
const readSaved = (restorationKey: string): SavedGridPosition | null => {
  try {
    const raw = sessionStorage.getItem(storageKeyFor(restorationKey));
    if (raw == null) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<SavedGridPosition>;
    return typeof parsed.mediaId === 'string' && typeof parsed.scrollTop === 'number'
      ? { mediaId: parsed.mediaId, scrollTop: parsed.scrollTop }
      : null;
  } catch {
    return null;
  }
};

const clearSaved = (restorationKey: string): void => {
  try {
    sessionStorage.removeItem(storageKeyFor(restorationKey));
  } catch {
    // ignore
  }
};

/** Reads and removes the saved position: it is consumed exactly once per grid mount. */
const takeSaved = (restorationKey: string): SavedGridPosition | null => {
  const saved = readSaved(restorationKey);
  clearSaved(restorationKey);
  return saved;
};

type RestoreAwareFetchPolicy = {
  fetchPolicy: WatchQueryFetchPolicy;
  nextFetchPolicy: WatchQueryFetchPolicy;
};

/**
 * Fetch policy for a paginated grid screen, decided ONCE per mount (frozen in a ref —
 * changing `fetchPolicy` on a live useQuery would re-apply options and could fetch).
 *
 * Returning to the grid via history with a saved tile and a non-empty cached list serves
 * the cached list as-is (`cache-first`): the `cache-and-network` remount refetch would
 * replace it with at most one server-capped page and force the restore loop to page back
 * down to the tile. `nextFetchPolicy` switches back to `cache-and-network` afterwards;
 * `refetch()` is always network-only and `fetchMore` always hits the network, so later
 * reloads and paging are unchanged. Mutations that make cached lists wrong (takenAt edits)
 * evict them, which makes `cachedCount` 0 and takes the normal path.
 */
export const useRestoreAwareFetchPolicy = ({
  restorationKey,
  cachedCount,
}: {
  restorationKey: string;
  cachedCount: number;
}): RestoreAwareFetchPolicy => {
  const navigationType = useNavigationType();
  const decisionRef = useRef<RestoreAwareFetchPolicy | null>(null);
  if (decisionRef.current == null) {
    const hasSavedEntry = readSaved(restorationKey) != null;
    const serveFromCache =
      navigationType === NavigationType.Pop && hasSavedEntry && cachedCount > 0;
    decisionRef.current = serveFromCache
      ? { fetchPolicy: 'cache-first', nextFetchPolicy: 'cache-and-network' }
      : { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-and-network' };
  }
  return decisionRef.current;
};

/**
 * On the grid's first mount the section's scroll-root ref isn't attached yet when the
 * grid's layout effects run (React attaches a parent's ref after its children's layout
 * effects), so the pre-paint restore finds the scroll container from the grid root.
 */
const findScrollableAncestor = (el: HTMLElement | null): HTMLElement | null => {
  for (let node = el?.parentElement ?? null; node != null; node = node.parentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node;
    }
  }
  return null;
};

/** Centers `tile` inside `scrollRoot` without scrolling any outer container. */
const centerTileInScrollRoot = (tile: Element, scrollRoot: HTMLElement): void => {
  const tileRect = tile.getBoundingClientRect();
  const rootRect = scrollRoot.getBoundingClientRect();
  scrollRoot.scrollTop +=
    tileRect.top - rootRect.top - (scrollRoot.clientHeight - tileRect.height) / 2;
};

type UseMediaGridScrollRestorationArgs = {
  /** Opt-in. Without a key the grid neither saves nor restores. */
  restorationKey?: string;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
  /** The grid's own root element; available in the grid's layout effects on first mount. */
  gridRootRef: RefObject<HTMLDivElement | null>;
  nodeCount: number;
  paging?: PagingState;
};

/**
 * Returns the grid to the tile the viewer opened when they come back via history (POP):
 * browser back, or the detail screen's `navigate(-1)`.
 *
 * - Save: a plain left-click on a tile link records `{ mediaId, scrollTop }` in
 *   sessionStorage. `defaultPrevented` can't be used as a guard: react-router's Link calls
 *   preventDefault on every navigating click, before this bubble-phase handler runs.
 *   Selection-mode and modifier clicks are excluded because they stopPropagation in
 *   capture (so neither the Link nor this handler runs), and non-link tiles (pickers)
 *   are ignored.
 * - Restore (POP only): once the query has settled, center the tile. If it is already
 *   rendered (the usual case when the screen served the list from cache — see
 *   `useRestoreAwareFetchPolicy`) this happens in a layout effect, before paint, so there
 *   is no flash at scrollTop 0. Otherwise a frame-deferred loop runs: `loadMore` and retry
 *   after the next settle; only once every page is loaded (or a page stops growing the
 *   list) fall back to the saved pixel offset.
 * - Any non-POP arrival discards the saved position.
 */
export const useMediaGridScrollRestoration = ({
  restorationKey,
  scrollRootRef,
  gridRootRef,
  nodeCount,
  paging,
}: UseMediaGridScrollRestorationArgs): {
  onGridClick: (event: MouseEvent<HTMLElement>) => void;
} => {
  const navigationType = useNavigationType();
  const armedKeyRef = useRef<string | null>(null);
  const pendingRef = useRef<SavedGridPosition | null>(null);
  /** nodeCount when we last called loadMore; guards against looping when a page adds nothing. */
  const loadRequestedAtCountRef = useRef<number | null>(null);

  const isSettled = paging?.isSettled ?? true;
  const hasMore = paging?.hasMore ?? false;
  const loadMore = paging?.loadMore;

  // Arm (consume the saved entry) and, when the tile is already rendered, restore before paint.
  useLayoutEffect(() => {
    if (restorationKey == null) {
      return;
    }

    if (armedKeyRef.current !== restorationKey) {
      armedKeyRef.current = restorationKey;
      loadRequestedAtCountRef.current = null;
      if (navigationType === NavigationType.Pop) {
        pendingRef.current = takeSaved(restorationKey);
      } else {
        pendingRef.current = null;
        clearSaved(restorationKey);
      }
    }

    const pending = pendingRef.current;
    const gridRoot = gridRootRef.current;
    if (pending == null || !isSettled || gridRoot == null) {
      return;
    }
    const tile = gridRoot.querySelector(
      `[${MEDIA_GRID_ITEM_ID_ATTR}="${CSS.escape(pending.mediaId)}"]`,
    );
    const scrollRoot = scrollRootRef?.current ?? findScrollableAncestor(gridRoot);
    if (tile == null || scrollRoot == null) {
      return;
    }
    centerTileInScrollRoot(tile, scrollRoot);
    pendingRef.current = null;
  }, [restorationKey, navigationType, scrollRootRef, gridRootRef, nodeCount, isSettled]);

  // Fallback loop: the tile wasn't rendered on a settled render (not cached, or cache trimmed).
  useEffect(() => {
    if (restorationKey == null) {
      return;
    }

    const pending = pendingRef.current;
    const scrollRoot = scrollRootRef?.current;
    if (pending == null || scrollRoot == null || !isSettled) {
      return;
    }

    // Two frames: let the settled node list commit and lay out before measuring.
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        const tile = scrollRoot.querySelector(
          `[${MEDIA_GRID_ITEM_ID_ATTR}="${CSS.escape(pending.mediaId)}"]`,
        );
        if (tile != null) {
          centerTileInScrollRoot(tile, scrollRoot);
          pendingRef.current = null;
          return;
        }

        const lastPageAddedNothing = loadRequestedAtCountRef.current === nodeCount;
        if (hasMore && loadMore != null && !lastPageAddedNothing) {
          loadRequestedAtCountRef.current = nodeCount;
          loadMore();
          return;
        }

        scrollRoot.scrollTop = pending.scrollTop;
        pendingRef.current = null;
      });
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [restorationKey, scrollRootRef, nodeCount, isSettled, hasMore, loadMore]);

  const onGridClick = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      if (restorationKey == null) {
        return;
      }
      // Modified / non-primary clicks open elsewhere; this grid isn't being left.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (!(event.target instanceof Element)) {
        return;
      }
      const link = event.target.closest('a[href]');
      const item = link?.closest(`[${MEDIA_GRID_ITEM_ID_ATTR}]`);
      const mediaId = item?.getAttribute(MEDIA_GRID_ITEM_ID_ATTR);
      const scrollRoot = scrollRootRef?.current;
      if (mediaId == null || scrollRoot == null || !event.currentTarget.contains(item ?? null)) {
        return;
      }
      writeSaved(restorationKey, { mediaId, scrollTop: scrollRoot.scrollTop });
    },
    [restorationKey, scrollRootRef],
  );

  return { onGridClick };
};
