import styled from 'styled-components';
import heroIllustration from '../assets/empty-state-hero.png';

// Hero illustration for empty states. Decorative (alt="", aria-hidden) — the
// EmptyState headline/text carry the meaning. Replaces the FilmRollMark
// placeholder; keep FilmRollMark.tsx around in case we revert.
export const HeroIllustration = () => (
  <HeroImage src={heroIllustration} alt="" aria-hidden />
);

const HeroImage = styled.img`
  display: block;
  width: 330px;
  max-width: 100%;
  height: auto;
`;
