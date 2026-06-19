import { useEffect, useRef, type RefObject } from 'react';
import { useNavigationType } from 'react-router-dom';

const STORAGE_PREFIX = 'betaname:gallery-scroll:';

type SavedGalleryScroll = {
  scrollTop: number;
  mediaId?: string;
};

export const saveGalleryScrollPosition = (
  storageKey: string,
  scrollRoot: HTMLElement | null | undefined,
  mediaId?: string,
): void => {
  if (scrollRoot == null) {
    return;
  }
  const payload: SavedGalleryScroll = {
    scrollTop: scrollRoot.scrollTop,
    mediaId,
  };
  sessionStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(payload));
};

const readSavedScroll = (storageKey: string): SavedGalleryScroll | undefined => {
  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
  if (raw == null) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as SavedGalleryScroll;
  } catch {
    return undefined;
  }
};

const clearSavedScroll = (storageKey: string): void => {
  sessionStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`);
};

const scrollToMediaTile = (mediaId: string, scrollRoot: HTMLElement): boolean => {
  const tile = scrollRoot.querySelector(`[data-testid="media-tile-${mediaId}"]`);
  if (!(tile instanceof HTMLElement)) {
    return false;
  }
  tile.scrollIntoView({ block: 'center' });
  return true;
};

type UseGalleryScrollRestorationArgs = {
  storageKey: string;
  scrollRootRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
  nodeCount: number;
  loadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
};

export const useGalleryScrollRestoration = ({
  storageKey,
  scrollRootRef,
  ready,
  nodeCount,
  loadMore,
  hasMore = false,
  isLoadingMore = false,
}: UseGalleryScrollRestorationArgs): void => {
  const navigationType = useNavigationType();
  const restoredRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = scrollRootRef.current;
    if (el == null) {
      return;
    }

    const onScroll = (): void => {
      if (saveTimeoutRef.current != null) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveGalleryScrollPosition(storageKey, el);
      }, 150);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (saveTimeoutRef.current != null) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [scrollRootRef, storageKey]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (navigationType !== 'POP') {
      restoredRef.current = false;
      clearSavedScroll(storageKey);
      return;
    }

    if (restoredRef.current) {
      return;
    }

    const saved = readSavedScroll(storageKey);
    if (saved == null) {
      return;
    }

    const el = scrollRootRef.current;
    if (el == null) {
      return;
    }

    const attemptRestore = (): void => {
      if (saved.mediaId != null && scrollToMediaTile(saved.mediaId, el)) {
        restoredRef.current = true;
        clearSavedScroll(storageKey);
        return;
      }

      if (saved.mediaId != null && hasMore && !isLoadingMore && loadMore != null) {
        loadMore();
        return;
      }

      el.scrollTop = saved.scrollTop;
      restoredRef.current = true;
      clearSavedScroll(storageKey);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(attemptRestore);
    });
  }, [
    ready,
    navigationType,
    storageKey,
    scrollRootRef,
    nodeCount,
    hasMore,
    isLoadingMore,
    loadMore,
  ]);
};
