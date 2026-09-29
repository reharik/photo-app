import { useQuery } from '@apollo/client/react';
import { useEffect, useRef } from 'react';

import { nextProcessingPollDelayMs } from '../application/processingPollSchedule';
import { ViewerProcessingMediaItemIdsDocument } from '../graphql/generated/types';

// Module state, not component state: grids unmount on navigation, and an item that settles
// while a grid is away (or while a different grid is watching) must still refresh that grid
// when it comes back.

/** Ids last known to be processing, from a processing-list answer or from the upload queue. */
const knownProcessingIds = new Set<string>();
/** Bumped whenever a known id leaves the processing list, i.e. something settled. */
let settledVersion = 0;
/** `settledVersion` each list last refreshed at; a list behind it is missing settled items. */
const refreshedAtVersion = new Map<string, number>();
/** Start of the current polling run; reset when a new id shows up, so it polls fast again. */
let pollStartedAt = Date.now();

const recordProcessingIds = (ids: readonly string[]): void => {
  const current = new Set(ids);
  let anyLeft = false;
  for (const id of knownProcessingIds) {
    if (!current.has(id)) {
      knownProcessingIds.delete(id);
      anyLeft = true;
    }
  }
  let anyNew = false;
  for (const id of current) {
    if (!knownProcessingIds.has(id)) {
      knownProcessingIds.add(id);
      anyNew = true;
    }
  }
  if (anyLeft) {
    settledVersion += 1;
  }
  if (anyNew) {
    pollStartedAt = Date.now();
  }
};

/**
 * Called by the upload queue once an upload is finalized. Seeding the id means an item that
 * is already READY by the next processing-list answer (a fast photo) still counts as having
 * left the list, so the grids refresh for it.
 */
export const noteMediaItemsProcessing = (ids: readonly string[]): void => {
  for (const id of ids) {
    knownProcessingIds.add(id);
  }
  if (ids.length > 0) {
    pollStartedAt = Date.now();
  }
};

export type ProcessingRefresher = {
  /** Stable per cached list, e.g. a media-grid restoration key. */
  key: string;
  /** Brings the list up to date. Called at most once per settle, and only while mounted. */
  refresh: () => void;
};

/**
 * Keeps READY-only lists (library, album items, the add-to-album picker) current while the
 * viewer's uploads finish processing server-side. Watches `viewer.processingMediaItemIds` —
 * UPLOADED/PROCESSING items from the last hour — polling only while it is non-empty, fast
 * at first and backing off. When an id leaves the list, every registered list that hasn't
 * refreshed since is refreshed: now if mounted, otherwise on its next mount's first answer.
 *
 * This is the only thing that refreshes lists for processing; the upload widget's own poll
 * drives its rows and nothing else.
 */
export const useProcessingMediaItems = (refreshers: readonly ProcessingRefresher[]): void => {
  const query = useQuery(ViewerProcessingMediaItemIdsDocument, { fetchPolicy: 'network-only' });
  const fetchedIds = query.data?.viewer?.processingMediaItemIds;

  const refreshersRef = useRef(refreshers);
  refreshersRef.current = refreshers;
  const refetchRef = useRef(query.refetch);
  refetchRef.current = query.refetch;
  // Held so a failed poll (data cleared by the error) doesn't read as "nothing processing"
  // and stop the loop.
  const lastIdsRef = useRef<readonly string[] | undefined>(undefined);
  if (fetchedIds != null) {
    lastIdsRef.current = fetchedIds;
  }
  const isProcessing = (lastIdsRef.current?.length ?? 0) > 0;
  const keysSignature = refreshers.map((refresher) => refresher.key).join('|');

  useEffect(() => {
    // A list first seen now was just fetched fresh, so it starts current.
    for (const { key } of refreshersRef.current) {
      if (!refreshedAtVersion.has(key)) {
        refreshedAtVersion.set(key, settledVersion);
      }
    }
    if (fetchedIds == null) {
      return;
    }
    recordProcessingIds(fetchedIds);
    for (const { key, refresh } of refreshersRef.current) {
      if ((refreshedAtVersion.get(key) ?? settledVersion) < settledVersion) {
        refreshedAtVersion.set(key, settledVersion);
        refresh();
      }
    }
  }, [fetchedIds, keysSignature]);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (): void => {
      timer = setTimeout(
        () => {
          void refetchRef
            .current()
            .catch(() => undefined)
            .finally(() => {
              if (!stopped) {
                schedule();
              }
            });
        },
        nextProcessingPollDelayMs(Date.now() - pollStartedAt),
      );
    };
    schedule();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [isProcessing]);
};
