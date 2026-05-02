import { ViewerOperation } from '@packages/contracts';
import {
  SharedMediaItemFragment,
  ViewerSharedMediaItemsQuery,
} from '../../graphql/generated/types';
import { mapMediaItemToSummaryVM } from '../media/mapMediaItemToSummaryVM';
import { SharedMediaItemVM } from './SharedMediaItemVM';

const mapNodeToSharedMediaItemVM = (node: SharedMediaItemFragment): SharedMediaItemVM => ({
  ...node,
  mediaItem: mapMediaItemToSummaryVM(node.mediaItem),
  viewerOperations: node.mediaItem.viewerOperations?.map((o) => ViewerOperation.fromValue(o)) ?? [],
  viewerIsOwner: false,
});

type SharedMediaItemsSlice = NonNullable<
  NonNullable<ViewerSharedMediaItemsQuery['viewer']>['sharedMediaItems']
>;

export const mapSharedMediaItemsQueryToVMs = (data: SharedMediaItemsSlice): SharedMediaItemVM[] => {
  return data.map(mapNodeToSharedMediaItemVM);
};
