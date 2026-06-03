import { useMemo } from 'react';
import styled from 'styled-components';
import { GalleryActionItems } from '../../hooks/useMultiSelectGallery';
import { ViewableItemVM } from '../../viewModels';
import { SelectableGalleryItem } from './SelectableGalleryItem';

export type MultiSelectProps = {
  isSelected: (id: string) => boolean;
  handleModifierClick: (e: React.MouseEvent, id: string, index: number) => void;
  toggleSelectAt: (id: string, index: number) => void;
};

const DEFAULT_GRID_MIN_COLUMN_PX = 280;
const DEFAULT_GRID_MIN_COLUMN_MOBILE_PX = 160;
const DEFAULT_GRID_GAP_SPACING_STEP = 1;
const DEFAULT_GRID_GAP_SPACING_STEP_MOBILE = 2;

type SelectableGalleryProps<T extends { id: string }> = {
  nodes: T[];
  mediaIdSelector?: (item: T) => string;
  multiSelectProps: MultiSelectProps;
  /** Shown when `nodes` is empty; ignored if omitted. */
  emptyState?: React.ReactNode;
  /** When true, render only the grid (no inner scroll/padding); parent supplies overflow. */
  embedInParentScroll?: boolean;
  /**
   * Minimum column width for `grid-template-columns: repeat(auto-fill, minmax(...))`.
   */
  gridMinColumnWidthPx?: number;
  gridMinColumnWidthPxMobile?: number;
  /** Grid `gap`, via `theme.spacing(gridGapSpacingStep)` (default 1). */
  gridGapSpacingStep?: number;
  /** Grid `gap` below 768px, via `theme.spacing(...)` (default 2). */
  gridGapSpacingStepMobile?: number;
  renderItem: (args: {
    item: T;
    orderedMediaIds: string[];
    isSelected: boolean;
    index: number;
  }) => React.ReactNode;
  /** When set, non-owner / shared items can use a dashed frame (see `SelectableGalleryItem`). */
  selectable?: boolean;
  selectableActions?: GalleryActionItems[];
};

export const SelectableGallery = <T extends ViewableItemVM>({
  nodes,
  mediaIdSelector = (item: T) => item.id,
  multiSelectProps,
  emptyState,
  embedInParentScroll = false,
  gridMinColumnWidthPx = DEFAULT_GRID_MIN_COLUMN_PX,
  gridMinColumnWidthPxMobile = DEFAULT_GRID_MIN_COLUMN_MOBILE_PX,
  gridGapSpacingStep = DEFAULT_GRID_GAP_SPACING_STEP,
  gridGapSpacingStepMobile = DEFAULT_GRID_GAP_SPACING_STEP_MOBILE,
  renderItem,
  selectable = true,
  selectableActions = [],
}: SelectableGalleryProps<T>) => {
  const orderedMediaIds = useMemo(() => nodes.map(mediaIdSelector), [nodes, mediaIdSelector]);

  if (nodes.length === 0) {
    if (emptyState == null) {
      return null;
    }
    if (embedInParentScroll) {
      return <EmbedEmptySlot>{emptyState}</EmbedEmptySlot>;
    }
    return <Content>{emptyState}</Content>;
  }
  const grid = (
    <GalleryContainer
      $minColumnPx={gridMinColumnWidthPx}
      $minColumnPxMobile={gridMinColumnWidthPxMobile}
      $gapStep={gridGapSpacingStep}
      $gapStepMobile={gridGapSpacingStepMobile}
    >
      {nodes.map((item, index) => {
        const hasActions = selectableActions.some(
          (x) => x.operation == null || item.operations?.includes(x.operation),
        );

        return (
          <SelectableGalleryItem
            key={item.id}
            itemId={mediaIdSelector(item)}
            selectable={selectable && hasActions}
            isSelected={multiSelectProps.isSelected(item.id)}
            onToggle={() => multiSelectProps.toggleSelectAt(item.id, index)}
            onModifierClick={(event) => multiSelectProps.handleModifierClick(event, item.id, index)}
            selectableActions={selectableActions}
            // Generic `T` + callback triggers no-unsafe-assignment despite explicit return type.
          >
            {renderItem({
              item,
              index,
              orderedMediaIds,
              isSelected: multiSelectProps.isSelected(item.id),
            })}
          </SelectableGalleryItem>
        );
      })}
    </GalleryContainer>
  );
  if (embedInParentScroll) {
    return grid;
  }
  return <Content>{grid}</Content>;
};

const GalleryContainer = styled.div<{
  $minColumnPx: number;
  $minColumnPxMobile: number;
  $gapStep: number;
  $gapStepMobile: number;
}>`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(${({ $minColumnPx }) => $minColumnPx}px, 1fr));
  gap: ${({ theme, $gapStep }) => theme.spacing($gapStep)};
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(
      auto-fill,
      minmax(${({ $minColumnPxMobile }) => $minColumnPxMobile}px, 1fr)
    );
    gap: ${({ theme, $gapStepMobile }) => theme.spacing($gapStepMobile)};
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  /* padding: ${({ theme }) => theme.spacing(6)}; */
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(3)};
  }
`;

/** Vertical spacing when empty state sits in a parent scroll area (padding comes from parent). */
const EmbedEmptySlot = styled.div`
  padding-top: ${({ theme }) => theme.spacing(2)};
`;
