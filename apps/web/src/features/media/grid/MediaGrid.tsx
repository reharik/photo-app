import { RefObject, useMemo, type ReactNode } from 'react';
import styled from 'styled-components';
import { PagingState } from '../../../hooks/getPaginatedQueryRenderState';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';
import type { ViewableItemVM } from '../../../viewModels/';
import { mediaGridColumnStyles, type MediaGridColumnCounts } from './gridColumns';
import { GroupResult } from './groupBy/groupByStrategyTypes';
import { MediaGridDateSection } from './MediaGridDateSection';
import { MediaGridSelectableItem } from './MediaGridSelectableItem';
import type { MultiSelectProps } from './types';
import { GridMediaItem } from './types';

export type MediaGridRenderContext = {
  mediaGalleryIds: string[];
};

type MediaGridProps<T extends ViewableItemVM> = {
  nodes: T[];
  getMediaItem?: (item: T) => GridMediaItem | undefined;
  renderItem: (item: T, ctx: MediaGridRenderContext) => ReactNode;
  multiSelectProps: MultiSelectProps;
  selectableActions?: GalleryActionItems[];
  selectable?: boolean;
  selectionActive: boolean;
  columnCounts: MediaGridColumnCounts;
  /** Date grouping uses `createdAt` from `getMediaItem(item)` when `groupBy` is `"date"`. */
  groupedSections?: GroupResult<T>[];
  /** When true, unselected tiles render subdued (e.g. after first selection in library). */
  dimUnselectedTiles?: boolean;
  /** When false, tiles hide the corner selection dot and become the selection control themselves. */
  showSelectionToggle?: boolean;
  /** Overrides the default grid gap (e.g. the picker packs tiles tighter). */
  tileGap?: string;
  paging?: PagingState;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
};

export const MediaGrid = <T extends ViewableItemVM>({
  paging,
  nodes,
  getMediaItem = (item: T) => item,
  renderItem,
  multiSelectProps,
  selectableActions = [],
  selectable = true,
  selectionActive,
  columnCounts,
  groupedSections,
  dimUnselectedTiles = false,
  showSelectionToggle = true,
  tileGap,
  scrollRootRef,
}: MediaGridProps<T>) => {
  const orderedMediaIds = useMemo(
    () => nodes.map((node) => getMediaItem(node)?.id).filter((id): id is string => id != null),
    [nodes, getMediaItem],
  );
  const { sentinelRef } = useInfiniteScroll({
    ...(paging ? paging : { hasMore: false, isLoadingMore: false, loadMore: () => {} }),
    scrollRootRef,
  });

  const indexById = useMemo(() => new Map(nodes.map((node, index) => [node.id, index])), [nodes]);
  const TRIGGER_FROM_END = 8; // at 20/page; tune by feel
  const renderTiles = (items: T[]) => (
    <TileGrid $columnCounts={columnCounts} $gap={tileGap}>
      {items.map((item, i) => {
        const selectionId = item.id;
        const globalIndex = indexById.get(selectionId) ?? 0;
        const hasActions = selectableActions.some(
          (action) => action.operation == null || item.operations?.includes(action.operation),
        );
        const mediaItem = getMediaItem(item);
        const isTrigger = i === items.length - TRIGGER_FROM_END;
        return (
          <MediaGridSelectableItem
            sentinelRef={isTrigger ? sentinelRef : undefined}
            key={selectionId}
            // Albums return no media item; fall back to the item's own id.
            itemId={mediaItem?.id ?? item.id}
            selectable={selectable && hasActions}
            selectionActive={selectionActive}
            isSelected={multiSelectProps.isSelected(selectionId)}
            onToggle={() => multiSelectProps.toggleSelectAt(selectionId, globalIndex)}
            onEnterSelection={() => multiSelectProps.enterSelectionAt(selectionId, globalIndex)}
            onModifierClick={(event) =>
              multiSelectProps.handleModifierClick(event, selectionId, globalIndex)
            }
            selectableActions={selectableActions}
            dimUnselectedTiles={dimUnselectedTiles}
            showSelectionToggle={showSelectionToggle}
          >
            {renderItem(item, { mediaGalleryIds: orderedMediaIds })}
          </MediaGridSelectableItem>
        );
      })}
    </TileGrid>
  );

  if (groupedSections) {
    return (
      <GridRoot>
        {groupedSections.map((section) => (
          <MediaGridDateSection key={section.key} label={section.label} subtitle={section.subtitle}>
            {renderTiles(section.items)}
          </MediaGridDateSection>
        ))}
      </GridRoot>
    );
  }

  return <GridRoot>{renderTiles(nodes)}</GridRoot>;
};

const GridRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  box-sizing: border-box;
`;

const TileGrid = styled.div<{ $columnCounts: MediaGridColumnCounts; $gap?: string }>`
  ${({ $columnCounts }) => mediaGridColumnStyles($columnCounts)}
  ${({ $gap }) => ($gap ? `gap: ${$gap};` : '')}
`;
