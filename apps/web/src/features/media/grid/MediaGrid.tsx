import { useMemo } from 'react';
import styled from 'styled-components';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';
import type { MediaItemSummaryVM, ViewableItemVM } from '../../../viewModels/';
import { bucketMediaByDate } from './bucketMediaByDate';
import { type MediaGridColumnCounts, mediaGridColumnStyles } from './gridColumns';
import { MediaGridDateSection } from './MediaGridDateSection';
import { MediaGridSelectableItem } from './MediaGridSelectableItem';
import { MediaGridTile, type MediaGridTileProps } from './MediaGridTile';
import type { MultiSelectProps } from './types';

export type MediaGridGroupBy = 'date' | 'none';

type MediaGridProps<T extends ViewableItemVM> = {
  nodes: T[];
  mediaIdSelector?: (item: T) => string;
  selectionIdSelector?: (item: T) => string;
  multiSelectProps: MultiSelectProps;
  selectableActions?: GalleryActionItems[];
  selectable?: boolean;
  selectionActive: boolean;
  columnCounts: MediaGridColumnCounts;
  /** Date grouping uses `createdAt` on `MediaItemSummaryVM` nodes only. */
  groupBy?: MediaGridGroupBy;
  getTileProps: (item: T, orderedMediaIds: string[]) => MediaGridTileProps;
};

export const MediaGrid = <T extends ViewableItemVM>({
  nodes,
  mediaIdSelector = (item: T) => item.id,
  selectionIdSelector = mediaIdSelector,
  multiSelectProps,
  selectableActions = [],
  selectable = true,
  selectionActive,
  columnCounts,
  groupBy = 'none',
  getTileProps,
}: MediaGridProps<T>) => {
  const orderedMediaIds = useMemo(() => nodes.map(mediaIdSelector), [nodes, mediaIdSelector]);
  const indexBySelectionId = useMemo(
    () => new Map(nodes.map((node, index) => [selectionIdSelector(node), index])),
    [nodes, selectionIdSelector],
  );
  const renderTiles = (items: T[]) => (
    <TileGrid $columnCounts={columnCounts}>
      {items.map((item) => {
        const selectionId = selectionIdSelector(item);
        const globalIndex = indexBySelectionId.get(selectionId) ?? 0;
        const hasActions = selectableActions.some(
          (action) => action.operation == null || item.operations?.includes(action.operation),
        );

        return (
          <MediaGridSelectableItem
            key={selectionId}
            itemId={mediaIdSelector(item)}
            selectable={selectable && hasActions}
            selectionActive={selectionActive}
            isSelected={multiSelectProps.isSelected(selectionId)}
            onToggle={() => multiSelectProps.toggleSelectAt(selectionId, globalIndex)}
            onEnterSelection={() => multiSelectProps.enterSelectionAt(selectionId, globalIndex)}
            onModifierClick={(event) =>
              multiSelectProps.handleModifierClick(event, selectionId, globalIndex)
            }
            selectableActions={selectableActions}
          >
            <MediaGridTile {...getTileProps(item, orderedMediaIds)} />
          </MediaGridSelectableItem>
        );
      })}
    </TileGrid>
  );

  if (groupBy === 'date') {
    // Date buckets require MediaItemSummaryVM (library). Other views use groupBy="none".
    const dateSections = bucketMediaByDate(nodes as unknown as MediaItemSummaryVM[]);

    return (
      <GridRoot>
        {dateSections.map((section) => (
          <MediaGridDateSection
            key={section.key}
            label={section.label}
            subtitle={section.subtitle}
            location={section.location}
          >
            {renderTiles(section.items as unknown as T[])}
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

const TileGrid = styled.div<{ $columnCounts: MediaGridColumnCounts }>`
  ${({ $columnCounts }) => mediaGridColumnStyles($columnCounts)}
`;
