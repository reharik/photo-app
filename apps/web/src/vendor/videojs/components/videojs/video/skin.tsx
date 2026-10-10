'use client';

import type { ComponentProps, ReactNode } from 'react';
import '../styles/video/base.css';
import './skin.css';

import { cn } from '../../../lib/utils';
import { BufferingIndicator } from '../ui/buffering-indicator';
import { Container } from '../ui/container';
import { ErrorDialog } from '../ui/error-dialog';
import { Poster } from '../ui/poster';
import { Title } from '../ui/title';

import { VideoGestures } from './behaviors/gestures';
import { VideoHotkeys } from './behaviors/hotkeys';
import { VideoStatusIndicators } from './display/status-indicators';
import { DefaultVideoControls } from './layout/controls';

export interface VideoSkinProps extends Omit<
  NonNullable<ComponentProps<typeof Container>>,
  'children'
> {
  children?: ReactNode;
  renderPoster?: NonNullable<ComponentProps<typeof Poster>>['renderImage'];
  renderThumbnail?: NonNullable<ComponentProps<typeof DefaultVideoControls>>['renderThumbnail'];
}

export function VideoSkin({
  children,
  className,
  renderPoster,
  renderThumbnail,
  ...props
}: VideoSkinProps = {}) {
  return (
    <Container
      className={cn('video-skin', className)}
      data-theme="default"
      data-preset="video"
      {...props}
    >
      {children}
      <Poster renderImage={renderPoster} />
      <BufferingIndicator />
      <ErrorDialog />
      <Title />

      <DefaultVideoControls renderThumbnail={renderThumbnail} />

      <VideoHotkeys />
      <VideoGestures />
      <VideoStatusIndicators />
    </Container>
  );
}
