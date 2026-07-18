import type { WatchQueryFetchPolicy } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import type { EntityType } from '@packages/contracts';
import { useMemo } from 'react';
import {
  ViewerUnseenActivityDocument,
  type ViewerUnseenActivityQuery,
} from '../graphql/generated/types';

export type UnseenActivityRow = NonNullable<
  NonNullable<ViewerUnseenActivityQuery['viewer']>['unseenActivity']
>[number];

export interface UseUnseenActivityResult {
  /** All unseen-activity rows for the viewer (empty until the query resolves). */
  rows: UnseenActivityRow[];
  /**
   * Container-level membership (album list, media grids): true when `id` is the
   * TARGET of some activity of `type`. This is the surface you clear by opening.
   */
  isTargetUnseen: (type: EntityType, id: string) => boolean;
  /**
   * Comment-level membership ONLY: true when `id` is the SOURCE of some activity
   * of `type`. Drives the comment bold-weight (Phase 3), never a container dot.
   */
  isSourceUnseen: (type: EntityType, id: string) => boolean;
  /** Nav-level EXISTS check: true when any row satisfies `predicate`. */
  anyUnseenMatching: (predicate: (row: UnseenActivityRow) => boolean) => boolean;
}

/**
 * The single source for every unseen dot/bold in the app. Reads the viewer-level
 * `unseenActivity` array (held once in the normalized Viewer cache object) and
 * exposes set-membership checks.
 *
 * ONE field per level: `isTargetUnseen` for container surfaces, `isSourceUnseen`
 * for the comment level. NEVER combine them ("source OR target") — a mediaItemAdded
 * row is (target=Album, source=Media); matching its source too would ghost-dot the
 * photo at the media level for merely existing in the album.
 *
 * `fetchPolicy` defaults to `cache-first`: this hook is consumed by many components
 * (every grid, the nav, every comment row) and we do NOT want each mount to fire its
 * own network request. Exactly one always-mounted consumer — AppShell (a layout route
 * wrapping all authed screens) — passes `cache-and-network` to drive the single
 * authoritative fetch. Clears refetch this query explicitly, and Apollo re-renders
 * every watcher (cache-first included) when the normalized array changes, so dots stay
 * correct everywhere without the redundant per-mount traffic.
 */
export const useUnseenActivity = (
  fetchPolicy: WatchQueryFetchPolicy = 'cache-first',
): UseUnseenActivityResult => {
  const { data } = useQuery(ViewerUnseenActivityDocument, { fetchPolicy });

  const rows = data?.viewer?.unseenActivity;

  return useMemo(() => {
    const list = rows ?? [];
    const targetSet = new Set<string>();
    const sourceSet = new Set<string>();
    for (const row of list) {
      targetSet.add(`${row.targetType.value}:${row.targetId}`);
      sourceSet.add(`${row.sourceType.value}:${row.sourceId}`);
    }
    return {
      rows: list,
      isTargetUnseen: (type: EntityType, id: string) => targetSet.has(`${type.value}:${id}`),
      isSourceUnseen: (type: EntityType, id: string) => sourceSet.has(`${type.value}:${id}`),
      anyUnseenMatching: (predicate: (row: UnseenActivityRow) => boolean) => list.some(predicate),
    };
  }, [rows]);
};
