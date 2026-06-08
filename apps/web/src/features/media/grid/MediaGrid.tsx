import { MediaKind } from '@packages/contracts';
import { useMemo } from 'react';
import styled from 'styled-components';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';
import type {
  MediaItemSummaryVM,
  ReactionCountsVM,
  ViewerReactionVM,
  ViewableItemVM,
} from '../../../viewModels/';
import { bucketMediaByDate } from './bucketMediaByDate';
import { type MediaGridColumnCounts, mediaGridColumnStyles } from './gridColumns';
import { MediaGridDateSection } from './MediaGridDateSection';
import { MediaGridSelectableItem } from './MediaGridSelectableItem';
import { MediaGridTile, type MediaGridTileFit } from './MediaGridTile';
import type { MultiSelectProps } from './types';

export type MediaGridGroupBy = 'date' | 'none';

export type GridMediaItem = {
  id: string;
  kind: MediaKind;
  title?: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
  /** When false, tile shows the kind placeholder instead of fetching a thumbnail. */
  hasThumbnail?: boolean;
} & ViewableItemVM;

type MediaGridProps<T extends ViewableItemVM> = {
  nodes: T[];
  toDisplayable?: (item: T) => GridMediaItem;
  multiSelectProps: MultiSelectProps;
  selectableActions?: GalleryActionItems[];
  selectable?: boolean;
  selectionActive: boolean;
  columnCounts: MediaGridColumnCounts;
  /** Date grouping uses `createdAt` on `MediaItemSummaryVM` nodes only. */
  groupBy?: MediaGridGroupBy;
  handleTileNavigate?: (itemId: string) => void;
  tileFit?: MediaGridTileFit;
  disableTileNavigation?: boolean;
  /** When true, unselected tiles render subdued (e.g. after first selection in library). */
  dimUnselectedTiles?: boolean;
  /** Tile link target; defaults to authed `/media/{id}`. */
  buildTileHref?: (itemId: string) => string;
  /** When true, desktop hover pill toggles heart and comment navigates to detail. */
  canReact?: boolean;
  /** Refetch list data after a successful reaction mutation. */
  onReactionsRefetch?: () => void;
};

export const MediaGrid = <T extends ViewableItemVM>({
  nodes,
  toDisplayable = (item: T) => item as unknown as GridMediaItem,
  multiSelectProps,
  selectableActions = [],
  selectable = true,
  selectionActive,
  columnCounts,
  groupBy = 'none',
  handleTileNavigate,
  tileFit = 'cover',
  disableTileNavigation = false,
  dimUnselectedTiles = false,
  buildTileHref,
  canReact = false,
  onReactionsRefetch,
}: MediaGridProps<T>) => {
  const orderedMediaIds = useMemo(
    () => nodes.map((x) => toDisplayable(x).id),
    [nodes, toDisplayable],
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
        const mediaItem = toDisplayable(item);
        return (
          <MediaGridSelectableItem
            key={selectionId}
            itemId={mediaItem.id}
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
            <MediaGridTile
              mediaGalleryIds={orderedMediaIds}
              kind={mediaItem.kind}
              title={mediaItem.title}
              reactionCounts={mediaItem.reactionCounts}
              viewerReactions={mediaItem.viewerReactions}
              hasThumbnail={mediaItem.hasThumbnail}
              canReact={canReact}
              onReactionsRefetch={onReactionsRefetch}
              itemId={mediaItem.id}
              onBeforeNavigate={handleTileNavigate}
              tileFit={tileFit}
              disableTileNavigation={disableTileNavigation}
              buildTileHref={buildTileHref}
            />
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
