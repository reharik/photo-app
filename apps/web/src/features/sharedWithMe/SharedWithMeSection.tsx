import { useRef } from 'react';
import styled from 'styled-components';
import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import { EmptyState } from '../../ui/EmptyState';
import { SharedWithMeMediaItemVM } from '../../viewModels/';
import { LIBRARY_GRID_COLUMNS } from '../media/grid/gridColumns';
import { MediaGrid } from '../media/grid/MediaGrid';
import { MediaGridTile } from '../media/grid/MediaGridTile';
import type { MultiSelectProps } from '../media/grid/types';

const noopMultiSelect: MultiSelectProps = {
  isSelected: () => false,
  handleModifierClick: () => undefined,
  toggleSelectAt: () => undefined,
  enterSelectionAt: () => undefined,
};

type SharedWithMeSectionProps = {
  sharedWithMeMediaItems: SharedWithMeMediaItemVM[];
  paging: PagingState;
  reloadData: () => void;
};

export const SharedWithMeSection = ({
  sharedWithMeMediaItems,
  paging,
  reloadData,
}: SharedWithMeSectionProps) => {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  return (
    <Container>
      <PageHeader>
        <Title>Media Shared with you</Title>
      </PageHeader>
      <ScrollArea ref={scrollRootRef}>
        {sharedWithMeMediaItems.length === 0 ? (
          <EmptyStateWrap>
            <EmptyState
              title="No shared media"
              text="When someone shares individual photos or videos with you, they will show up here."
            />
          </EmptyStateWrap>
        ) : (
          <GridWrap>
            <MediaGrid
              nodes={sharedWithMeMediaItems}
              paging={paging}
              scrollRootRef={scrollRootRef}
              getMediaItem={(item) => item.mediaItem}
              multiSelectProps={noopMultiSelect}
              selectableActions={[]}
              selectable={false}
              selectionActive={false}
              columnCounts={LIBRARY_GRID_COLUMNS}
              renderItem={(item, ctx) => (
                <MediaGridTile
                  item={item.mediaItem}
                  mediaGalleryIds={ctx.mediaGalleryIds}
                  canReact
                  onReactionsRefetch={reloadData}
                />
              )}
            />
          </GridWrap>
        )}
      </ScrollArea>
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  flex-shrink: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  box-shadow: inset 0 -0.5px 0 ${({ theme }) => theme.color.borderSubtle};
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(3)}`};

  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(1.5)}`};
  }
`;

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.3px;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 18px;
    letter-spacing: -0.2px;
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
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
