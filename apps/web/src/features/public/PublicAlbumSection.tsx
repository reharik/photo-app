import { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { EmptyState } from '../../ui/EmptyState';
import { PublicAlbumItemSummaryVM } from '../../viewModels/publicAlbum/PublicAlbumItemSummaryVM';
import { PublicAlbumSummaryVM } from '../../viewModels/publicAlbum/PublicAlbumSummaryVM';
import { AlbumSectionMetadata } from '../albums/AlbumSectionMetadata';
import { SelectableGallery } from '../gallery/SelectableGallery';
import { SelectableGalleryHeader } from '../gallery/SelectableGalleryHeader';
import { PublicAlbumMediaTile } from '../gallery/tiles/PublicAlbumMediaTile';

const META_COMPACT_AFTER_SCROLL_PX = 32;

type PublicAlbumSectionProps = {
  album: PublicAlbumSummaryVM;
  albumItems: PublicAlbumItemSummaryVM[];
  retrieveAlbumItems: () => void;
};

export const PublicAlbumSection = ({ album, albumItems }: PublicAlbumSectionProps) => {
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const [metaCompact, setMetaCompact] = useState(false);

  const { multiSelectProps, availableActions, clearSelection, selectionCount } =
    useMultiSelectGallery({
      nodes: albumItems,
      actions: [],
    });

  const onAlbumScroll = useCallback((): void => {
    const el = albumScrollRef.current;
    if (el == null) {
      return;
    }
    setMetaCompact(el.scrollTop > META_COMPACT_AFTER_SCROLL_PX);
  }, []);

  const renderHeader = () => {
    return (
      <>
        <Title>{album?.title ?? 'Album'}</Title>
      </>
    );
  };
  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        availableActions={availableActions}
        Header={renderHeader}
      />
      <AlbumBodyScroll ref={albumScrollRef} onScroll={onAlbumScroll}>
        <AlbumSectionMetadata
          count={albumItems.length}
          album={album}
          metaCompact={metaCompact}
          albumItems={albumItems}
          isPublic={true}
        />
        <SelectableGallery
          nodes={albumItems}
          multiSelectProps={multiSelectProps}
          embedInParentScroll
          emptyState={
            <EmptyState
              title="No album items yet"
              text="Start choosing media items to include to build your gallery"
            />
          }
          renderItem={({ item }) => <PublicAlbumMediaTile item={item} />}
        />
      </AlbumBodyScroll>
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

const Title = styled.h1`
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.color.bodyText};
`;

const AlbumBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 ${({ theme }) => theme.spacing(6)} ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0 ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(3)};
  }
`;
