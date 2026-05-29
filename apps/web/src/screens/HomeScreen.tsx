import { useQuery } from '@apollo/client/react';
import { RecentMediaSection } from '../features/media/RecentMediaSection';
import { ViewerRecentMediaDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';

export const HomeScreen = () => {
  const query = useQuery(ViewerRecentMediaDocument, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });

  const {
    data: nodes,
    content,
    refetch,
  } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.mediaItems.nodes ?? [],
  });

  if (!nodes) {
    return content;
  }

  return <RecentMediaSection nodes={nodes} reloadData={refetch} />;
};
