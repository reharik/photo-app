import styled from 'styled-components';
import { GalleryConfigItems, useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { SharedMediaItemVM } from '../../viewModels/sharing/SharedMediaItemVM';
import { EmptyState } from './gallery/EmptyState';
import { MediaItemTile } from './gallery/mediaTiles/MediaItemTile';
import { SelectableGallery, type MultiSelectProps } from './gallery/SelectableGallery';
import { SelectableGalleryHeader } from './gallery/SelectableGalleryHeader';

const noopSelect: MultiSelectProps = {
  isSelected: () => false,
  handleModifierClick: () => {
    /* read-only: no selection */
  },
  toggleSelectAt: () => {
    /* read-only: no selection */
  },
};

type SharedWithMeSectionProps = {
  sharedMediaItems: SharedMediaItemVM[];
};

export const SharedWithMeSection = ({ sharedMediaItems }: SharedWithMeSectionProps) => {
  const selectableActions: GalleryConfigItems[] = [];

  const { clearSelection, selectionCount } = useMultiSelectGallery({
    nodes: sharedMediaItems,
    actions: selectableActions,
  });
  return (
    <Container>
      <Block>
        <SelectableGalleryHeader
          selectionCount={selectionCount}
          clearSelection={clearSelection}
          availableActions={[]}
          Header={() => <Title>Media Shared with you</Title>}
        />
        <SelectableGallery
          nodes={sharedMediaItems}
          multiSelectProps={noopSelect}
          emptyState={
            <EmptyState
              title="No shared media"
              text="When someone shares individual photos or videos with you, they will show up here."
            />
          }
          renderItem={({ item, orderedMediaIds: galleryIds }) => (
            <MediaItemTile item={item.mediaItem} mediaGalleryIds={galleryIds} />
          )}
        />
      </Block>
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  overflow: auto;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: -0.5px;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.2px;
    flex: 1;
  }
`;
const Block = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;
