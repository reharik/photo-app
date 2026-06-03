import { ApolloClient } from '@apollo/client';

import { MediaItemStatus } from '@packages/contracts';

import {
  type ViewerMediaItemStatusQuery,
  ViewerMediaItemStatusDocument,
} from '../../graphql/generated/types';

export type AwaitMediaItemsReadyOptions = {
  pollIntervalMs?: number;
  maxDurationMs?: number;
  /**
   * Called the first time this item reaches {@link MediaItemStatus.ready} (not invoked on timeout
   * or terminal error snapshot). Enables incremental UI refreshes while other items finish processing.
   */
  onItemReady?: (mediaItemId: string) => void;
};

const waitUntilMediaItemReadyOrTimeout = (
  client: ApolloClient,
  mediaItemId: string,
  pollIntervalMs: number,
  maxDurationMs: number,
  onItemReady?: (mediaItemId: string) => void,
): Promise<void> =>
  new Promise<void>((resolve) => {
    let settled = false;
    let readyNotified = false;
    const waitTimer: { id?: ReturnType<typeof setTimeout> } = {};
    const observableQuery = client.watchQuery<ViewerMediaItemStatusQuery>({
      query: ViewerMediaItemStatusDocument,
      variables: { mediaItemId },
      fetchPolicy: 'network-only',
      pollInterval: pollIntervalMs,
    });

    const settle = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (waitTimer.id !== undefined) {
        clearTimeout(waitTimer.id);
      }
      void observableQuery.stopPolling();
      subscription.unsubscribe();
      resolve();
    };

    const subscription = observableQuery.subscribe({
      next: (result) => {
        const status =
          'data' in result && result.data != null
            ? result.data.viewer?.mediaItem?.status
            : undefined;
        if (status === MediaItemStatus.ready) {
          if (!readyNotified && onItemReady !== undefined) {
            readyNotified = true;
            onItemReady(mediaItemId);
          }
          settle();
        }
      },
      error: () => {
        settle();
      },
    });

    waitTimer.id = setTimeout(settle, maxDurationMs);
  });

/** Poll backend processing status via Apollo {@link ApolloClient.watchQuery} until each item is ready or timeouts elapse. */
export const awaitMediaItemsReady = async (
  client: ApolloClient,
  mediaItemIds: string[],
  options?: AwaitMediaItemsReadyOptions,
): Promise<void> => {
  if (mediaItemIds.length === 0) {
    return;
  }

  const pollIntervalMs = options?.pollIntervalMs ?? 1500;
  const maxDurationMs = options?.maxDurationMs ?? 180_000;
  const onItemReady = options?.onItemReady;

  await Promise.all(
    mediaItemIds.map((mediaItemId) =>
      waitUntilMediaItemReadyOrTimeout(
        client,
        mediaItemId,
        pollIntervalMs,
        maxDurationMs,
        onItemReady,
      ),
    ),
  );
};
