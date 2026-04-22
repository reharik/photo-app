import { MediaKind } from '@packages/contracts';
import styled from 'styled-components';
import { MediaItemSummaryVM } from '../../../../viewModels/media/MediaItemSummaryVM';

export const SelectionTile = ({
  item,
  mediaGalleryIds,
}: {
  item: MediaItemSummaryVM;
  mediaGalleryIds: string[];
}) => {
  return (
    <>
      {item.thumbnailUrl ? (
        <ThumbImage src={item.thumbnailUrl} alt={item.title.trim()} />
      ) : (
        <ThumbIcon aria-hidden>{item.kind === MediaKind.video ? '🎬' : '🖼️'}</ThumbIcon>
      )}
    </>
  );
};

const ThumbImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-height: 0;
`;

const ThumbIcon = styled.div`
  font-size: 48px;
  opacity: 0.35;
`;
