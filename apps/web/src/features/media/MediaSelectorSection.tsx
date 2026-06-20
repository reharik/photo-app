import styled from 'styled-components';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { EmptyState } from '../../ui/EmptyState';
import { MediaItemSummaryVM } from '../../viewModels/';
import { PICKER_GRID_COLUMNS } from './grid/gridColumns';
import { MediaGrid } from './grid/MediaGrid';
import { MediaGridTile } from './grid/MediaGridTile';
import { MediaPickerSelectionBar } from './MediaPickerSelectionBar';

type MediaSelectorSectionProps = {
  nodes: MediaItemSummaryVM[];
  header: React.ReactNode;
  onAddToAlbum: (selectedIds: string[]) => void;
};

export const MediaSelectorSection = ({
  nodes,
  header,
  onAddToAlbum,
}: MediaSelectorSectionProps) => {
  const selectableActions = [
    {
      label: 'Add to album',
      onAction: () => onAddToAlbum(Array.from(selectedIds)),
    },
  ];
  const { multiSelectProps, selectedIds, clearSelection, selectionCount } = useMultiSelectGallery({
    nodes,
    actions: selectableActions,
  });

  return (
    <Container>
      <HeaderSlot>
        {selectionCount > 0 ? (
          <MediaPickerSelectionBar
            count={selectionCount}
            onCancel={clearSelection}
            onAddToAlbum={() => onAddToAlbum(Array.from(selectedIds))}
          />
        ) : (
          <IdleHeader>{header}</IdleHeader>
        )}
      </HeaderSlot>

      <PickerScrollArea>
        {nodes.length === 0 ? (
          <EmptyStateWrap>
            <EmptyState title="No media items to add" text="No media items to add" />
          </EmptyStateWrap>
        ) : (
          <GridWrap>
            <MediaGrid
              nodes={nodes}
              multiSelectProps={multiSelectProps}
              selectableActions={selectableActions}
              selectionActive
              dimUnselectedTiles={selectionCount > 0}
              columnCounts={PICKER_GRID_COLUMNS}
              renderItem={(item, ctx) => (
                <MediaGridTile
                  item={item}
                  mediaGalleryIds={ctx.mediaGalleryIds}
                  canReact={false}
                  tileFit="contain"
                  disableTileNavigation
                />
              )}
            />
          </GridWrap>
        )}
      </PickerScrollArea>
    </Container>
  );
};

const Container = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const HeaderSlot = styled.div`
  flex-shrink: 0;
  width: 100%;
  background: ${({ theme }) => theme.color.bodyRaised};
  box-shadow: inset 0 -0.5px 0 ${({ theme }) => theme.color.borderSubtle};
`;

const IdleHeader = styled.div`
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};

  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing(1.25)} ${theme.spacing(1.5)}`};
  }
`;

const PickerScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const GridWrap = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const EmptyStateWrap = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;
