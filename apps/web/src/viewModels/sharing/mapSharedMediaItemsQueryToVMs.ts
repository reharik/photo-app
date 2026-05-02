import { ViewerOperation } from '@packages/contracts';
import {
  SharedWithMedMediaItemFragment,
  ViewerSharedWithMedMediaItemsQuery,
} from '../../graphql/generated/types';
import { mapMediaItemToSummaryVM } from '../media/mapMediaItemToSummaryVM';
import { SharedWithMedMediaItemVM } from './SharedWithMedMediaItemVM';

const mapNodeToSharedWithMedMediaItemVM = (
  node: SharedWithMedMediaItemFragment,
): SharedWithMedMediaItemVM => ({
  ...node,
  mediaItem: mapMediaItemToSummaryVM(node.mediaItem),
  viewerOperations: node.mediaItem.viewerOperations?.map((o) => ViewerOperation.fromValue(o)) ?? [],
  viewerIsOwner: false,
});

type SharedWithMedMediaItemsSlice = NonNullable<
  NonNullable<ViewerSharedWithMedMediaItemsQuery['viewer']>['sharedWithMeMediaItems']
>;

export const mapSharedWithMedMediaItemsQueryToVMs = (
  data: SharedWithMedMediaItemsSlice,
): SharedWithMedMediaItemVM[] => {
  return data.map(mapNodeToSharedWithMedMediaItemVM);
};
