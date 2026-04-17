import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to `window.matchMedia`. Server snapshot is false.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => {
        mq.removeEventListener('change', onChange);
      };
    },
    [query],
  );

  const getSnapshot = (): boolean => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = (): boolean => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
