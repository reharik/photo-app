import styled from 'styled-components';
import { printLightboxMatte } from '../../../ui/Print';

export type ImageRendererProps = {
  id: string;
  src: string;
  alt: string;
};

export const ImageRenderer = ({ id, src, alt }: ImageRendererProps) => {
  return (
    <StyledImg
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

// Thin print matte on the dark stage: the <img> box tracks the photo aspect
// (no internal letterbox), so the matte hugs the photo — a print resting on the
// stage rather than a bare image floating on the dark.
const StyledImg = styled.img`
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  ${printLightboxMatte}
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
