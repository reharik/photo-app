import type { ComponentProps } from 'react';

import { cn } from '../../../../lib/utils';
import { SeekIndicator } from '../../ui/seek-indicator';
import { StatusAnnouncer } from '../../ui/status-announcer';
import { PlaybackStatusIndicator, StatusIndicator } from '../../ui/status-indicator';
import { VolumeIndicator } from '../../ui/volume-indicator';

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
