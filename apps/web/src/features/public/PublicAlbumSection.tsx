import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { EmptyState } from '../../ui/EmptyState';
import { HeroIllustration } from '../../ui/HeroIllustration';
import { PublicAlbumItemSummaryVM, PublicAlbumSummaryVM } from '../../viewModels/';
import { ALBUM_GRID_COLUMNS } from '../media/grid/gridColumns';
import { MediaGrid } from '../media/grid/MediaGrid';
import { MediaGridTile } from '../media/grid/MediaGridTile';
import type { MultiSelectProps } from '../media/grid/types';
import { PublicAlbumHeader } from './PublicAlbumHeader';
import { PUBLIC_OFFER_BAR_HEIGHT_PX, PublicAlbumOfferBar } from './PublicAlbumOfferBar';

const META_COMPACT_AFTER_SCROLL_PX = 32;

// Same threshold the shared album components use, so the header, the offer surface, and the
// grid all agree on where "mobile" starts.
const MOBILE_MEDIA = '(max-width: 768px)';

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
  const isMobile = useMediaQuery(MOBILE_MEDIA);

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

  // The owner is always an active user with an enforced non-empty name, but the payload
  // types it nullable (owner is left-joined and both name parts are nullable String), so an
  // empty result stays possible. When it happens, every "shared with you by" line is omitted
  // rather than rendered with a trailing blank — the offer still reads on its own.
  const ownerName = [album.owner?.firstName, album.owner?.lastName]
    .filter((part) => part != null && part.trim() !== '')
    .join(' ');

  return (
    <Container>
      <PublicAlbumHeader
        album={album}
        count={totalCount}
        ownerName={ownerName}
        compact={metaCompact}
        isMobile={isMobile}
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
      <PublicAlbumOfferBar albumId={album.id} ownerName={ownerName} />
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

  /* The mobile offer bar is position:fixed, so it takes no layout space — without this the
     last photo row would sit permanently underneath it. Bar height + its safe-area padding
     + the normal bottom gutter, so the final row clears the bar rather than just touching
     it. Kept on the SCROLLER (not the grid) so the padding scrolls into view at the end
     instead of being clipped by the overflow box. */
  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)}
      calc(
        ${PUBLIC_OFFER_BAR_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) +
          ${({ theme }) => theme.spacing(2)}
      );
  }
`;

const GridWrap = styled.div`
  width: 100%;
`;
