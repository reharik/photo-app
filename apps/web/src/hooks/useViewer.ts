import { useQuery } from '@apollo/client/react';
import { ViewerDocument, type ViewerQuery } from '../graphql/generated/types';

export type Viewer = NonNullable<ViewerQuery['viewer']>;

export interface UseViewerResult {
  viewer?: Viewer;
  loading: boolean;
  error?: Error;
}

/**
 * Authenticated callers get the session viewer. Anonymous callers do NOT get `viewer: null`:
 * the API rejects the request ("Invalid access mode", HTTP 500), which surfaces here as
 * `error`. `RequireViewer` relies on that to redirect to /login — so only call this from
 * signed-in screens, never from anything rendered on a public share page.
 */
// This looks like it's making a query every time you need the viewer but it's really
// just pulling it from cache.
export const useViewer = (): UseViewerResult => {
  const { data, loading, error } = useQuery(ViewerDocument);

  return {
    viewer: data?.viewer ?? undefined,
    loading,
    error: error ?? undefined,
  };
};
