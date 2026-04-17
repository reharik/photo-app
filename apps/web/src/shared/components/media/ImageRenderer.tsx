import styled from 'styled-components';

export type ImageRendererProps = {
  src: string;
  alt: string;
};

export const ImageRenderer = ({ src, alt }: ImageRendererProps) => {
  return (
    <StyledImg
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
