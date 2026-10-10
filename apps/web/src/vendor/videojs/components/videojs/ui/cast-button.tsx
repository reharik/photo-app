'use client';

import { CastButton as CastButtonPrimitive } from '@videojs/react';
import {
  CastEnterIcon as CastEnterIconPrimitive,
  CastExitIcon as CastExitIconPrimitive,
} from '@videojs/react/icons';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/buttons.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { Button } from '@videojs-skin/components/videojs/ui/button';
import { resolveClassName } from '@videojs-skin/lib/resolve-class-name';
import { cn } from '@videojs-skin/lib/utils';

export type CastButtonProps = Omit<CastButtonPrimitive.Props, 'children'>;

export function CastButton({ className, ...props }: CastButtonProps = {}) {
  return (
    <CastButtonPrimitive
      render={<Button />}
      className={(state) => cn('media-cast-button', resolveClassName(className, state))}
      {...props}
    >
      <CastEnterIconPrimitive className={cn('media-button-icon', 'media-cast-button-enter-icon')} />
      <CastExitIconPrimitive className={cn('media-button-icon', 'media-cast-button-exit-icon')} />
    </CastButtonPrimitive>
  );
}
