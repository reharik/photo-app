'use client';

import { AirPlayButton as AirPlayButtonPrimitive } from '@videojs/react';
import {
  AirPlayEnterIcon as AirPlayEnterIconPrimitive,
  AirPlayExitIcon as AirPlayExitIconPrimitive,
} from '@videojs/react/icons';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/buttons.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { Button } from '@videojs-skin/components/videojs/ui/button';
import { resolveClassName } from '@videojs-skin/lib/resolve-class-name';
import { cn } from '@videojs-skin/lib/utils';

export type AirPlayButtonProps = Omit<AirPlayButtonPrimitive.Props, 'children'>;

export function AirPlayButton({ className, ...props }: AirPlayButtonProps = {}) {
  return (
    <AirPlayButtonPrimitive
      render={<Button />}
      className={(state) => cn('media-airplay-button', resolveClassName(className, state))}
      {...props}
    >
      <AirPlayEnterIconPrimitive
        className={cn('media-button-icon', 'media-airplay-button-enter-icon')}
      />
      <AirPlayExitIconPrimitive
        className={cn('media-button-icon', 'media-airplay-button-exit-icon')}
      />
    </AirPlayButtonPrimitive>
  );
}
