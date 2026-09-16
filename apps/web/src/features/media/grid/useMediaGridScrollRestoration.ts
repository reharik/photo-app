import { useCallback, useEffect, useRef, type MouseEvent, type RefObject } from 'react';
import { NavigationType, useNavigationType } from 'react-router-dom';
import type { PagingState } from '../../../hooks/getPaginatedQueryRenderState';

const STORAGE_PREFIX = 'homeroll:media-grid-scroll:';

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

/** Reads and removes the saved position: it is consumed exactly once per grid mount. */
const takeSaved = (restorationKey: string): SavedGridPosition | null => {
  try {
    const raw = sessionStorage.getItem(storageKeyFor(restorationKey));
    sessionStorage.removeItem(storageKeyFor(restorationKey));
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
  nodeCount: number;
  paging?: PagingState;
};

/**
 * Returns the grid to the tile the viewer opened when they come back via history (POP):
 * browser back, or the detail screen's `navigate(-1)`.
 *
 * - Save: a plain left-click on a tile link records `{ mediaId, scrollTop }` in
 *   sessionStorage. Selection-mode clicks never reach the handler (the selectable item
 *   stops propagation in capture), and non-link tiles (pickers) are ignored.
 * - Restore (POP only): wait until the query has settled — the `cache-and-network`
 *   refetch on remount replaces the list — then center the tile. If it isn't loaded yet,
 *   `loadMore` and retry after the next settle. Only once every page is loaded (or a
 *   page stops growing the list) fall back to the saved pixel offset.
 * - Any non-POP arrival discards the saved position.
 */
export const useMediaGridScrollRestoration = ({
  restorationKey,
  scrollRootRef,
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

  useEffect(() => {
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
  }, [restorationKey, navigationType, scrollRootRef, nodeCount, isSettled, hasMore, loadMore]);

  const onGridClick = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      if (restorationKey == null || event.defaultPrevented) {
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
