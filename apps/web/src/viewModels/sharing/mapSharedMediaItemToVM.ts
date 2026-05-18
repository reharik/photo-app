import { SharedWithMedMediaItemVM } from '..';
import {
  SharedWithMedMediaItemFragment,
  ViewerSharedWithMedMediaItemsQuery,
} from '../../graphql/generated/types';

const mapSharedMediaItemToVM = (
  node: SharedWithMedMediaItemFragment,
): SharedWithMedMediaItemVM => ({
  ...node,
  mediaItem: node.mediaItem,
  operations: node.mediaItem.operations ?? [],
});

type SharedWithMedMediaItemsSlice = NonNullable<
  NonNullable<ViewerSharedWithMedMediaItemsQuery['viewer']>['sharedWithMeMediaItems']
>;

export const mapSharedMediaItemsToVMs = (
  data: SharedWithMedMediaItemsSlice,
): SharedWithMedMediaItemVM[] => {
  return data.map(mapSharedMediaItemToVM);
};
