'use client';

import type { VolumeSliderProps as CoreVolumeSliderProps } from '@videojs/core';
import { VolumePopover as VolumePopoverPrimitive } from '@videojs/react';
import type { ClassValue } from 'cn';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/popups.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { cn } from '../../../lib/utils';
import { ButtonTooltip } from './button-tooltip';
import { MuteButton } from './mute-button';
import { VolumeSlider } from './volume-slider';

export interface VolumePopoverProps extends Omit<VolumePopoverPrimitive.RootProps, 'children'> {
  className?: ClassValue;
  orientation?: CoreVolumeSliderProps['orientation'];
  showTooltip?: boolean;
}

export function VolumePopover({
  className,
  showTooltip = false,
  side = 'top',
  orientation = 'vertical',
  ...props
}: VolumePopoverProps = {}) {
  return (
    <VolumePopoverPrimitive.Root openOnHover delay={200} closeDelay={100} side={side} {...props}>
      <ButtonTooltip delay={0} disabled={!showTooltip} sticky side="top">
        <VolumePopoverPrimitive.Trigger render={<MuteButton className={cn(className)} />} />
      </ButtonTooltip>
      <VolumePopoverPrimitive.Popup
        className={cn(
          'media-popup',
          'media-popup-safe-area',
          'media-popup-transition',
          'media-popup-surface',
          'media-volume-popover',
        )}
      >
        <VolumeSlider orientation={orientation} />
      </VolumePopoverPrimitive.Popup>
    </VolumePopoverPrimitive.Root>
  );
}
