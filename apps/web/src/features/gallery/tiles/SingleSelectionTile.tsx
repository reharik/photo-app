import { MediaAssetKind, MediaKind } from '@packages/contracts';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../../domain/formatters/mediaItemUrlBuilder';
import { MediaItemSummaryVM } from '../../../viewModels/media/MediaItemSummaryVM';

const THUMB_SCALE = 0.65;

export const SingleSelectionTile = ({
  item,
  onSelect,
}: {
  item: MediaItemSummaryVM;
  onSelect: (mediaId: string) => void;
}) => {
  const url = buildMediaItemUrl(item.id, MediaAssetKind.thumbnail);
  return (
    <ThumbFrame onClick={() => onSelect(item.id)}>
      {item.kind === MediaKind.photo ? (
        <ThumbImage src={url} alt={item.title?.trim() ?? ''} />
      ) : (
        <ThumbIcon aria-hidden $scale={THUMB_SCALE}>
          {'🎬'}
        </ThumbIcon>
      )}
    </ThumbFrame>
  );
};

/** Matches media grid cards; image is scaled down inside without cropping (use contain, not cover on a shrunken box). */
const ThumbFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  aspect-ratio: 4 / 3;
  flex-shrink: 0;
`;

const ThumbImage = styled.img`
  /* max-width: ${THUMB_SCALE * 100}%;
  max-height: ${THUMB_SCALE * 100}%; */
  width: auto;
  height: auto;
  object-fit: contain;
`;

const ThumbIcon = styled.div<{ $scale: number }>`
  font-size: ${({ $scale }) => `${48 * $scale}px`};
  line-height: 1;
  opacity: 0.35;
`;
