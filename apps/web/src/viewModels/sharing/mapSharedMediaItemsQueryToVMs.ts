import { SharePermission } from '@packages/contracts';
import {
  SharedMediaItemFragment,
  ViewerSharedMediaItemsQuery,
} from '../../graphql/generated/types';
import { mapMediaItemToSummaryVM } from '../media/mapMediaItemToSummaryVM';
import { SharedMediaItemVM } from './SharedMediaItemVM';

const mapNodeToSharedMediaItemVM = (node: SharedMediaItemFragment): SharedMediaItemVM => ({
  ...node,
  permission: SharePermission.fromValue(node.permission),
  mediaItem: mapMediaItemToSummaryVM(node.mediaItem),
});

type SharedMediaItemsSlice = NonNullable<
  NonNullable<ViewerSharedMediaItemsQuery['viewer']>['sharedMediaItems']
>;

export const mapSharedMediaItemsQueryToVMs = (data: SharedMediaItemsSlice): SharedMediaItemVM[] => {
  return data.map(mapNodeToSharedMediaItemVM);
};
