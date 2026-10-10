import type { ComponentProps } from 'react';

import { SeekIndicator } from '@videojs-skin/components/videojs/ui/seek-indicator';
import { StatusAnnouncer } from '@videojs-skin/components/videojs/ui/status-announcer';
import { PlaybackStatusIndicator, StatusIndicator } from '@videojs-skin/components/videojs/ui/status-indicator';
import { VolumeIndicator } from '@videojs-skin/components/videojs/ui/volume-indicator';
import { cn } from '@videojs-skin/lib/utils';

export type VideoStatusIndicatorsProps = Omit<ComponentProps<'div'>, 'children'>;

export function VideoStatusIndicators({ className, ...props }: VideoStatusIndicatorsProps = {}) {
  return (
    <>
      <StatusAnnouncer />
      <div className={cn('video-status-indicators', className)} {...props}>
        <VolumeIndicator />
        <StatusIndicator />
        <SeekIndicator />
        <PlaybackStatusIndicator />
      </div>
    </>
  );
}
