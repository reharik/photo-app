'use client';

import { VolumeSlider as VolumeSliderPrimitive } from '@videojs/react';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/sliders.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { SliderFill, SliderThumb, SliderTrack } from '@videojs-skin/components/videojs/ui/slider';
import { resolveClassName } from '@videojs-skin/lib/resolve-class-name';
import { cn } from '@videojs-skin/lib/utils';

export type VolumeSliderProps = Omit<VolumeSliderPrimitive.RootProps, 'children'>;

export function VolumeSlider({ className, ...props }: VolumeSliderProps = {}) {
  return (
    <VolumeSliderPrimitive.Root
      className={(state) =>
        cn('media-slider', 'media-volume-slider', resolveClassName(className, state))
      }
      thumbAlignment="edge"
      {...props}
    >
      <VolumeSliderPrimitive.Track render={<SliderTrack />}>
        <VolumeSliderPrimitive.Fill render={<SliderFill />} />
      </VolumeSliderPrimitive.Track>
      <VolumeSliderPrimitive.Thumb
        render={<SliderThumb />}
        className={'media-volume-slider-thumb'}
      />
    </VolumeSliderPrimitive.Root>
  );
}
