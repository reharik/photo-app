import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import { ViewerRecentMediaDocument } from '../graphql/generated/types';
import { RecentMediaSection } from '../shared/components/RecentMediaSection';
import { mapMultipleMediaItemsToMediaItemSummaryVMs } from '../viewModels/media/mapMediaItemToMediaItemSummaryVM';

export const HomeScreen = () => {
  const { data, loading, error, refetch } = useQuery(ViewerRecentMediaDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const nodes = useMemo(
    () => mapMultipleMediaItemsToMediaItemSummaryVMs(data?.viewer?.mediaItems.nodes ?? []),
    [data],
  );

  // TODO: handle loading and error states
  return <RecentMediaSection nodes={nodes} reloadData={refetch} />;
};
