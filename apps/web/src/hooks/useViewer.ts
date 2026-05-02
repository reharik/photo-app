import { useQuery } from '@apollo/client/react';
import { ViewerDocument, type ViewerQuery } from '../graphql/generated/types';

export type Viewer = NonNullable<ViewerQuery['viewer']>;

export interface UseViewerResult {
  viewer?: Viewer;
  loading: boolean;
  error?: Error;
}

/** Anonymous callers get `viewer: null` from the API; authenticated callers get the session viewer. */
export const useViewer = (): UseViewerResult => {
  const { data, loading, error } = useQuery(ViewerDocument);

  return {
    viewer: data?.viewer ?? undefined,
    loading,
    error: error ?? undefined,
  };
};
