'use client';

import { StatusAnnouncer as StatusAnnouncerPrimitive } from '@videojs/react';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/indicators.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { resolveClassName } from '@videojs-skin/lib/resolve-class-name';
import { cn } from '@videojs-skin/lib/utils';

export type StatusAnnouncerProps = Omit<StatusAnnouncerPrimitive.Props, 'children'>;

export function StatusAnnouncer({ className, ...props }: StatusAnnouncerProps = {}) {
  return (
    <StatusAnnouncerPrimitive
      className={(state) => cn('media-status-announcer', resolveClassName(className, state))}
      {...props}
    />
  );
}
