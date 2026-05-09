import { ReactNode } from 'react';
import { StageImageCloseButton, ViewerCard } from './MediaViewerStyles';

type MediaViewerSingleProps = {
  media: ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
};

export const MediaViewerSingle = ({
  media,
  onClose,
  showCloseButton = true,
}: MediaViewerSingleProps) => {
  return (
    <ViewerCard $positionForOverlay>
      {media}
      {showCloseButton ? (
        <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
          ✕
        </StageImageCloseButton>
      ) : null}
    </ViewerCard>
  );
};
