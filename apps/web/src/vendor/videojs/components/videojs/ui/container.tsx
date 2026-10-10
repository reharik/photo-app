'use client';

import { Container as ContainerPrimitive } from '@videojs/react';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/container.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { cn } from '../../../lib/utils';

export interface ContainerProps extends Omit<ContainerPrimitive.Props, 'children'> {
  children?: ContainerPrimitive.Props['children'];
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <ContainerPrimitive className={cn('media-skin', 'media-container', className)} {...props}>
      {children}
    </ContainerPrimitive>
  );
}
