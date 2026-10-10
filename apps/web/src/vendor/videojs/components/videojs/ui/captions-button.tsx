'use client';

import '../styles/base.css';
import '../styles/audio/theme.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';
import '../styles/buttons.css';
import { CaptionsButton as CaptionsButtonPrimitive } from '@videojs/react';
import {
  CaptionsOffIcon as CaptionsOffIconPrimitive,
  CaptionsOnIcon as CaptionsOnIconPrimitive,
} from '@videojs/react/icons';

import { Button } from '@videojs-skin/components/videojs/ui/button';
import { resolveClassName } from '@videojs-skin/lib/resolve-class-name';
import { cn } from '@videojs-skin/lib/utils';

export type CaptionsButtonProps = Omit<CaptionsButtonPrimitive.Props, 'children'>;

export function CaptionsButton({ className, ...props }: CaptionsButtonProps = {}) {
  return (
    <CaptionsButtonPrimitive
      render={<Button />}
      className={(state) => cn('media-captions-button', resolveClassName(className, state))}
      {...props}
    >
      <CaptionsOffIconPrimitive className={cn('media-button-icon', 'media-captions-button-off-icon')} />
      <CaptionsOnIconPrimitive className={cn('media-button-icon', 'media-captions-button-on-icon')} />
    </CaptionsButtonPrimitive>
  );
}
