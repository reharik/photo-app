import { DateTime } from 'luxon';
import { useMemo, type ReactNode } from 'react';
import styled from 'styled-components';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';
import type { MediaItemSummaryVM, ViewableItemVM } from '../../../viewModels/';
import { bucketMediaByDate } from './bucketMediaByDate';
import { mediaGridColumnStyles, type MediaGridColumnCounts } from './gridColumns';
import { MediaGridDateSection } from './MediaGridDateSection';
import { MediaGridSelectableItem } from './MediaGridSelectableItem';
import type { MultiSelectProps } from './types';

export type MediaGridGroupBy = 'date' | 'none';

export type GridMediaItem = {
  id: string;
  createdAt?: DateTime;
};

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
  groupBy?: MediaGridGroupBy;
  /** When true, unselected tiles render subdued (e.g. after first selection in library). */
  dimUnselectedTiles?: boolean;
};

export const MediaGrid = <T extends ViewableItemVM>({
  nodes,
  getMediaItem = (item: T) => item,
  renderItem,
  multiSelectProps,
  selectableActions = [],
  selectable = true,
  selectionActive,
  columnCounts,
  groupBy = 'none',
  dimUnselectedTiles = false,
}: MediaGridProps<T>) => {
  const orderedMediaIds = useMemo(
    () => nodes.map((node) => getMediaItem(node)?.id).filter((id): id is string => id != null),
    [nodes, getMediaItem],
  );
  const indexById = useMemo(() => new Map(nodes.map((node, index) => [node.id, index])), [nodes]);
  const renderTiles = (items: T[]) => (
    <TileGrid $columnCounts={columnCounts}>
      {items.map((item) => {
        const selectionId = item.id;
        const globalIndex = indexById.get(selectionId) ?? 0;
        const hasActions = selectableActions.some(
          (action) => action.operation == null || item.operations?.includes(action.operation),
        );
        const mediaItem = getMediaItem(item);
        return (
          <MediaGridSelectableItem
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
          >
            {renderItem(item, { mediaGalleryIds: orderedMediaIds })}
          </MediaGridSelectableItem>
        );
      })}
    </TileGrid>
  );

  if (groupBy === 'date') {
    type DateBucketProxy = MediaItemSummaryVM & { __node: T };

    const bucketProxies: DateBucketProxy[] = [];
    for (const node of nodes) {
      const createdAt = getMediaItem(node)?.createdAt;
      if (createdAt == null || !createdAt.isValid) {
        continue;
      }
      bucketProxies.push({ createdAt, __node: node } as DateBucketProxy);
    }

    const dateSections = bucketMediaByDate(bucketProxies);

    return (
      <GridRoot>
        {dateSections.map((section) => (
          <MediaGridDateSection
            key={section.key}
            label={section.label}
            subtitle={section.subtitle}
            location={section.location}
          >
            {renderTiles(section.items.map((proxy) => (proxy as DateBucketProxy).__node))}
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
