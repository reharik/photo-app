import { useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';

export type ImageRendererProps = {
  id: string;
  src: string;
  alt: string;
  onDisplayReady?: () => void;
};

const waitForImagePaintable = async (img: HTMLImageElement): Promise<void> => {
  if (!img.complete) {
    await new Promise<void>((resolve) => {
      const onDone = (): void => {
        img.removeEventListener('load', onDone);
        img.removeEventListener('error', onDone);
        resolve();
      };
      img.addEventListener('load', onDone);
      img.addEventListener('error', onDone);
      if (img.complete) {
        onDone();
      }
    });
  }
  try {
    await img.decode();
  } catch {
    // Cached or unsupported decode() — onLoad path is sufficient.
  }
};

export const ImageRenderer = ({ id, src, alt, onDisplayReady }: ImageRendererProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const onDisplayReadyRef = useRef(onDisplayReady);
  onDisplayReadyRef.current = onDisplayReady;

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img == null) {
      return;
    }

    let cancelled = false;

    void waitForImagePaintable(img).then(() => {
      if (!cancelled) {
        onDisplayReadyRef.current?.();
      }
    });

    return (): void => {
      cancelled = true;
    };
  }, [src]);

  return (
    <StyledImg
      ref={imgRef}
      data-testid={id}
      src={src}
      alt={alt}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
      }}
    />
  );
};

const StyledImg = styled.img`
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  -webkit-user-drag: none;
  user-select: none;

  @media (min-width: 969px) {
    /* Overlay chrome: more vertical room vs old side-by-side arrows + heavy card padding */
    max-height: min(calc(100dvh - 96px), 85dvh);
  }

  @media (max-width: 968px) {
    max-height: min(82dvh, calc(100dvh - 72px));
  }
`;
