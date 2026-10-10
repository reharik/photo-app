'use client';

import { CaptionsButton as CaptionsButtonPrimitive } from '@videojs/react';
import {
  CaptionsOffIcon as CaptionsOffIconPrimitive,
  CaptionsOnIcon as CaptionsOnIconPrimitive,
} from '@videojs/react/icons';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/buttons.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { resolveClassName } from '../../../lib/resolve-class-name';
import { cn } from '../../../lib/utils';
import { Button } from './button';

export type CaptionsButtonProps = Omit<CaptionsButtonPrimitive.Props, 'children'>;

export function CaptionsButton({ className, ...props }: CaptionsButtonProps = {}) {
  return (
    <CaptionsButtonPrimitive
      render={<Button />}
      className={(state) => cn('media-captions-button', resolveClassName(className, state))}
      {...props}
    >
      <CaptionsOffIconPrimitive
        className={cn('media-button-icon', 'media-captions-button-off-icon')}
      />
      <CaptionsOnIconPrimitive
        className={cn('media-button-icon', 'media-captions-button-on-icon')}
      />
    </CaptionsButtonPrimitive>
  );
}
