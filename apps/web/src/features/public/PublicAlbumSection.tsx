import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import { EmptyState } from '../../ui/EmptyState';
import { HeroIllustration } from '../../ui/HeroIllustration';
import { PublicAlbumItemSummaryVM, PublicAlbumSummaryVM } from '../../viewModels/';
import { AlbumSectionMetadata } from '../albums/AlbumSectionMetadata';
import { ALBUM_GRID_COLUMNS } from '../media/grid/gridColumns';
import { MediaGrid } from '../media/grid/MediaGrid';
import { MediaGridTile } from '../media/grid/MediaGridTile';
import type { MultiSelectProps } from '../media/grid/types';

const META_COMPACT_AFTER_SCROLL_PX = 32;

const noopMultiSelect: MultiSelectProps = {
  isSelected: () => false,
  handleModifierClick: () => undefined,
  toggleSelectAt: () => undefined,
  enterSelectionAt: () => undefined,
};

type PublicAlbumSectionProps = {
  album: PublicAlbumSummaryVM;
  albumItems: PublicAlbumItemSummaryVM[];
  paging: PagingState;
  totalCount: number;
};

export const PublicAlbumSection = ({
  album,
  albumItems,
  paging,
  totalCount,
}: PublicAlbumSectionProps) => {
  const { token } = useParams<{ token: string }>();
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const [metaCompact, setMetaCompact] = useState(false);

  const buildTileHref = useMemo(
    () => (itemId: string) => `/shared/${token}/media/${itemId}`,
    [token],
  );

  const onAlbumScroll = useCallback((): void => {
    const el = albumScrollRef.current;
    if (el == null) {
      return;
    }
    setMetaCompact(el.scrollTop > META_COMPACT_AFTER_SCROLL_PX);
  }, []);

  return (
    <Container>
      <AlbumSectionMetadata
        count={totalCount}
        album={album}
        metaCompact={metaCompact}
        albumItems={albumItems}
        isPublic={true}
      />
      <AlbumBodyScroll
        ref={(el) => {
          albumScrollRef.current = el;
        }}
        onScroll={onAlbumScroll}
      >
        {albumItems.length === 0 ? (
          <EmptyState
            illustration={<HeroIllustration />}
            title="No album items yet"
            text="Start choosing media items to include to build your gallery"
          />
        ) : (
          <GridWrap>
            <MediaGrid
              nodes={albumItems}
              paging={paging}
              scrollRootRef={albumScrollRef}
              getMediaItem={(item) => item.mediaItem}
              multiSelectProps={noopMultiSelect}
              selectableActions={[]}
              selectable={false}
              selectionActive={false}
              columnCounts={ALBUM_GRID_COLUMNS}
              renderItem={(item, ctx) => (
                <MediaGridTile
                  item={item.mediaItem}
                  mediaGalleryIds={ctx.mediaGalleryIds}
                  canReact={false}
                  buildTileHref={buildTileHref}
                />
              )}
            />
          </GridWrap>
        )}
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

const AlbumBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(6)}
    ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)}
      ${({ theme }) => theme.spacing(3)};
  }
`;

const GridWrap = styled.div`
  width: 100%;
`;
