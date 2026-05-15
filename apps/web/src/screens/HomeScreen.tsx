import { useQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { RecentMediaSection } from '../features/media/RecentMediaSection';
import { ViewerRecentMediaDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';

export const HomeScreen = () => {
  const query = useQuery(ViewerRecentMediaDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });
  const { refetch } = query;

  const reloadData = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  const { data: nodes, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.mediaItems.nodes ?? [],
  });

  if (!nodes) {
    return content;
  }

  return <RecentMediaSection nodes={nodes} reloadData={reloadData} />;
};
