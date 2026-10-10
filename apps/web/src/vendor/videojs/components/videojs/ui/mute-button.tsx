'use client';

import { MuteButton as MuteButtonPrimitive } from '@videojs/react';
import {
  VolumeHighIcon as VolumeHighIconPrimitive,
  VolumeLowIcon as VolumeLowIconPrimitive,
  VolumeOffIcon as VolumeOffIconPrimitive,
} from '@videojs/react/icons';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/buttons.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { resolveClassName } from '../../../lib/resolve-class-name';
import { cn } from '../../../lib/utils';
import { Button } from './button';

export type MuteButtonProps = Omit<MuteButtonPrimitive.Props, 'children'>;

export function MuteButton({ className, ...props }: MuteButtonProps = {}) {
  return (
    <MuteButtonPrimitive
      render={<Button />}
      className={(state) => cn('media-mute-button', resolveClassName(className, state))}
      {...props}
    >
      <VolumeOffIconPrimitive className={cn('media-button-icon', 'media-mute-button-off-icon')} />
      <VolumeLowIconPrimitive className={cn('media-button-icon', 'media-mute-button-low-icon')} />
      <VolumeHighIconPrimitive className={cn('media-button-icon', 'media-mute-button-high-icon')} />
    </MuteButtonPrimitive>
  );
}
