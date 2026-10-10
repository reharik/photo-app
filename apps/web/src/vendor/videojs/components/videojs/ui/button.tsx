'use client';

import type { ComponentProps } from 'react';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/buttons.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { cn } from '@videojs-skin/lib/utils';

/** Shared button carrying the base interactive styles used by media controls. */
export type ButtonProps = ComponentProps<'button'>;

export function Button({ className, ...props }: ButtonProps) {
  return <button className={cn('media-button', className)} {...props} />;
}
