import styled from 'styled-components';
import heroIllustration from '../assets/empty-state-hero.png';

// Hero illustration for empty states. Decorative (alt="", aria-hidden) — the
// EmptyState headline/text carry the meaning. Replaces the FilmRollMark
// placeholder; keep FilmRollMark.tsx around in case we revert.
// `size` (px width) defaults to the empty-state size; the auth hero renders it larger.
type Props = { size?: number };

export const HeroIllustration = ({ size = 70 }: Props) => (
  <HeroImage src={heroIllustration} alt="" aria-hidden $size={size} />
);

const HeroImage = styled.img<{ $size: number }>`
  display: block;
  width: ${({ $size }) => $size}px;
  max-width: 100%;
  height: auto;
`;
