import { Controls, Time, Tooltip } from '@videojs/react';
// homeroll: usePlayer added, to hide the control-bar mute button while muted (see below).
import { usePlayer } from '@videojs/react/video';
import type { ComponentProps } from 'react';

import { AirPlayButton } from '@videojs-skin/components/videojs/ui/airplay-button';
import { ButtonTooltip } from '@videojs-skin/components/videojs/ui/button-tooltip';
import { CaptionsButton } from '@videojs-skin/components/videojs/ui/captions-button';
import { FullscreenButton } from '@videojs-skin/components/videojs/ui/fullscreen-button';
import { PlayButton } from '@videojs-skin/components/videojs/ui/play-button';
import { TimeSlider } from '@videojs-skin/components/videojs/ui/time-slider';
import { VolumePopover } from '@videojs-skin/components/videojs/ui/volume-popover';
import { cn } from '@videojs-skin/lib/utils';

// homeroll: CastButton, PiPButton and VideoSettingsMenu imports removed with their controls (see below).

export interface DefaultVideoControlsProps {
  renderThumbnail?: NonNullable<ComponentProps<typeof TimeSlider>>['renderThumbnail'];
}

export function DefaultVideoControls({ renderThumbnail }: DefaultVideoControlsProps = {}) {
  // homeroll: while muted the viewer shows its own "Tap to unmute" pill (VideoRenderer), so the
  // control-bar mute button is hidden until sound is on.
  const muted = usePlayer((state) => state.muted);

  return (
    <Controls.Root>
      <Controls.Backdrop className={'video-controls-backdrop'} />
      {/* homeroll: data-video-controls marks the control bar for useMobileViewerGestures (no swipe-nav from here). */}
      <Controls.Content className={cn('video-controls', 'video-controls-content')} data-video-controls="">
        <Tooltip.Provider>
          <Controls.Group className={'video-controls-primary'}>
            <ButtonTooltip side="top">
              <PlayButton />
            </ButtonTooltip>
            {/* homeroll: hidden while muted (see `muted` above). */}
            {muted ? null : <VolumePopover className={'video-controls-volume-button'} />}

            <Controls.Group className={'video-time-slider-group'}>
              <Time.Value className={cn('media-time-value', 'video-time-value')} type="current" />
              <TimeSlider renderThumbnail={renderThumbnail} />
              <Time.Value className={cn('media-time-toggle', 'video-time-value')} type="remaining" toggle />
            </Controls.Group>

            <ButtonTooltip side="top">
              <CaptionsButton className={'video-controls-captions-button'} />
            </ButtonTooltip>
            {/* homeroll: settings menu (VideoSettingsMenu) removed. */}
          </Controls.Group>

          <Controls.Group className={'video-controls-secondary'}>
            {/* homeroll: cast (CastButton) and picture-in-picture (PiPButton) buttons removed. */}
            <ButtonTooltip side="top">
              <AirPlayButton />
            </ButtonTooltip>
            <ButtonTooltip side="top">
              <FullscreenButton />
            </ButtonTooltip>
          </Controls.Group>
        </Tooltip.Provider>
      </Controls.Content>
    </Controls.Root>
  );
}
