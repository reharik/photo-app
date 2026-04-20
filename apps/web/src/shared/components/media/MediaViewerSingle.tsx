import { ReactNode } from 'react';
import { StageImageCloseButton, ViewerCard } from './MediaViewerStyles';

type MediaViewerSingleProps = {
  media: ReactNode;
  onClose: () => void;
};

export const MediaViewerSingle = ({ media, onClose }: MediaViewerSingleProps) => {
  return (
    <ViewerCard $positionForOverlay>
      {media}
      <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
        ✕
      </StageImageCloseButton>
    </ViewerCard>
  );
};
