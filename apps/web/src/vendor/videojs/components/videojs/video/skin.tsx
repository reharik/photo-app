'use client';

import type { ComponentProps, ReactNode } from 'react';
import '../styles/video/base.css';
import './skin.css';

import { BufferingIndicator } from '@videojs-skin/components/videojs/ui/buffering-indicator';
import { Container } from '@videojs-skin/components/videojs/ui/container';
import { ErrorDialog } from '@videojs-skin/components/videojs/ui/error-dialog';
import { Poster } from '@videojs-skin/components/videojs/ui/poster';
import { Title } from '@videojs-skin/components/videojs/ui/title';
import { cn } from '@videojs-skin/lib/utils';

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
