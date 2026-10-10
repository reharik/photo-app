'use client';

import { PiPButton as PiPButtonPrimitive } from '@videojs/react';
import {
  PipEnterIcon as PipEnterIconPrimitive,
  PipExitIcon as PipExitIconPrimitive,
} from '@videojs/react/icons';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/buttons.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { resolveClassName } from '../../../lib/resolve-class-name';
import { cn } from '../../../lib/utils';
import { Button } from './button';

export type PiPButtonProps = Omit<PiPButtonPrimitive.Props, 'children'>;

export function PiPButton({ className, ...props }: PiPButtonProps = {}) {
  return (
    <PiPButtonPrimitive
      render={<Button />}
      className={(state) => cn('media-pip-button', resolveClassName(className, state))}
      {...props}
    >
      <PipEnterIconPrimitive className={cn('media-button-icon', 'media-pip-button-enter-icon')} />
      <PipExitIconPrimitive className={cn('media-button-icon', 'media-pip-button-exit-icon')} />
    </PiPButtonPrimitive>
  );
}
