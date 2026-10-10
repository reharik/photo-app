import type { ComponentProps } from 'react';

import { AudioTrackMenu } from '@videojs-skin/components/videojs/ui/audio-track-menu';
import { CaptionsSubmenu } from '@videojs-skin/components/videojs/ui/captions-submenu';
import { PlaybackRateSubmenu } from '@videojs-skin/components/videojs/ui/playback-rate-submenu';
import { QualityMenu } from '@videojs-skin/components/videojs/ui/quality-menu';
import { SettingsMenu } from '@videojs-skin/components/videojs/ui/settings-menu';

export type VideoSettingsMenuProps = Omit<
  NonNullable<ComponentProps<typeof SettingsMenu>>,
  'children'
>;

export function VideoSettingsMenu(props: VideoSettingsMenuProps = {}) {
  return (
    <SettingsMenu {...props}>
      <QualityMenu />
      <AudioTrackMenu />
      <PlaybackRateSubmenu />
      <CaptionsSubmenu />
    </SettingsMenu>
  );
}
