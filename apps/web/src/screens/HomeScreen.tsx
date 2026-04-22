import { useQuery } from '@apollo/client/react';
import { useCallback } from 'react';
import { ViewerRecentMediaDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../shared/components/dataAccess/getQueryRenderState';
import { RecentMediaSection } from '../shared/components/RecentMediaSection';
import { mapMultipleMediaItemsToMediaItemSummaryVMs } from '../viewModels/media/mapMediaItemToMediaItemSummaryVM';

export const HomeScreen = () => {
  const query = useQuery(ViewerRecentMediaDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });
  const { refetch } = query;

  const reloadData = useCallback((): void => {
    void refetch();
  }, [refetch]);

  const { data: nodes, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.mediaItems.nodes,
    map: mapMultipleMediaItemsToMediaItemSummaryVMs,
  });

  if (!nodes) {
    return content;
  }

  return <RecentMediaSection nodes={nodes} reloadData={reloadData} />;
};
