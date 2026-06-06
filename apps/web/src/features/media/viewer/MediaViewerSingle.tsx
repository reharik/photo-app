import type { ReactNode } from 'react';
import { ViewerStageDesktop } from './MediaViewerStyles';

type MediaViewerSingleProps = {
  media: ReactNode;
};

/** Desktop-only layout when gallery navigation is disabled; close lives in the rail. */
export const MediaViewerSingle = ({ media }: MediaViewerSingleProps) => {
  return <ViewerStageDesktop>{media}</ViewerStageDesktop>;
};
