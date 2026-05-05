import {
  SharedWithMedMediaItemFragment,
  ViewerSharedWithMedMediaItemsQuery,
} from '../../graphql/generated/types';
import { mapMediaItemToSummaryVM } from '../media/mapMediaItemToSummaryVM';
import { SharedWithMedMediaItemVM } from './SharedMediaItemVM';

const mapSharedMediaItemToVM = (
  node: SharedWithMedMediaItemFragment,
): SharedWithMedMediaItemVM => ({
  ...node,
  mediaItem: mapMediaItemToSummaryVM(node.mediaItem),
  viewerOperations: node.mediaItem.viewerOperations ?? [],
  viewerIsOwner: false,
});

type SharedWithMedMediaItemsSlice = NonNullable<
  NonNullable<ViewerSharedWithMedMediaItemsQuery['viewer']>['sharedWithMeMediaItems']
>;

export const mapSharedMediaItemsToVMs = (
  data: SharedWithMedMediaItemsSlice,
): SharedWithMedMediaItemVM[] => {
  return data.map(mapSharedMediaItemToVM);
};
