import { useMemo } from 'react';
import styled from 'styled-components';
import { MaxWidthBreakpoint, MinWidthBreakpoint } from '../../../styles/theme';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';
import type { MultiSelectProps } from '../../gallery/SelectableGallery';
import type { MediaItemSummaryVM } from '../../../viewModels/';
import { bucketMediaByDate } from './bucketMediaByDate';
import { LibraryDateSection } from './LibraryDateSection';
import { LibraryMediaTile } from './LibraryMediaTile';
import { LibrarySelectableItem } from './LibrarySelectableItem';

type LibraryGridProps = {
  nodes: MediaItemSummaryVM[];
  multiSelectProps: MultiSelectProps;
  selectableActions?: GalleryActionItems[];
  selectable?: boolean;
  selectionActive: boolean;
};

export const LibraryGrid = ({
  nodes,
  multiSelectProps,
  selectableActions = [],
  selectable = true,
  selectionActive,
}: LibraryGridProps) => {
  const orderedMediaIds = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const indexById = useMemo(() => new Map(nodes.map((n, i) => [n.id, i])), [nodes]);
  const buckets = useMemo(() => bucketMediaByDate(nodes), [nodes]);

  return (
    <GridRoot>
      {buckets.map((bucket) => (
        <LibraryDateSection
          key={bucket.key}
          label={bucket.label}
          subtitle={bucket.subtitle}
          location={bucket.location}
        >
          <TileGrid>
            {bucket.items.map((item) => {
              const globalIndex = indexById.get(item.id) ?? 0;
              const hasActions = selectableActions.some(
                (x) => x.operation == null || item.operations?.includes(x.operation),
              );

              return (
                <LibrarySelectableItem
                  key={item.id}
                  itemId={item.id}
                  selectable={selectable && hasActions}
                  selectionActive={selectionActive}
                  isSelected={multiSelectProps.isSelected(item.id)}
                  onToggle={() => multiSelectProps.toggleSelectAt(item.id, globalIndex)}
                  onModifierClick={(event) =>
                    multiSelectProps.handleModifierClick(event, item.id, globalIndex)
                  }
                  selectableActions={selectableActions}
                >
                  <LibraryMediaTile
                    item={item}
                    mediaGalleryIds={orderedMediaIds}
                    burstCount={undefined}
                  />
                </LibrarySelectableItem>
              );
            })}
          </TileGrid>
        </LibraryDateSection>
      ))}
    </GridRoot>
  );
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

const TileGrid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;

  @media screen and (min-width: ${MinWidthBreakpoint.Tablet}px) and (max-width: ${MaxWidthBreakpoint.Tablet}px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media screen and (min-width: ${MinWidthBreakpoint.Desktop}px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;
