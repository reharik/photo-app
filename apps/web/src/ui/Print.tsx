import type { ReactNode } from 'react';
import styled, { css } from 'styled-components';

/**
 * The keepsake "print" treatment. Photos render as physical prints resting on
 * the surface, not flush flat grid cells. Three intensities:
 *
 * - `cover`  — FULL. Warm matte + warm drop shadow + two sheets peeking from
 *              BEHIND the card (offset outward, z-index:-1, NOT inside the matte)
 *              + a gentle hover lift (translateY, no rotate). For album covers.
 * - `tile`   — CALM. Small matte + inner-edge inset ring only. No outward shadow,
 *              no stack, no lift. Grid gap does the separating. For grid photos.
 *              Applied as the `printTileMatte` mixin so it can live inside the
 *              existing tile frame without adding wrapper elements (which would
 *              disturb the reaction pill / unseen dot positioning).
 * - `lightbox` — THIN matte + warm shadow. A print sitting on the dark stage.
 *              Applied as the `printLightboxMatte` mixin directly on the image.
 *
 * Palette is frozen: matte = `color.print` (warm-white paper), shadow =
 * `boxShadow.print`, ring = `color.borderSubtle`. No raw colors here.
 */
export type PrintVariant = 'cover' | 'tile' | 'lightbox';

/**
 * Responsive tile-matte width, published as a CSS custom property so every tile
 * overlay (reaction pill, unseen dot, burst badge, select ring) can offset
 * inward by the *current* mat width — 12px desktop, 6px mobile — without each
 * one duplicating the breakpoint. 12px eats too much of the photo at ~390px.
 *
 * Descendants of the tile frame inherit `--tile-matte` for free; the select
 * ring (a sibling of the frame, not a descendant) sets it on itself via this
 * same mixin so the two stay in lockstep.
 */
export const TILE_MATTE_VAR = 'var(--tile-matte)';

/**
 * Responsive tile geometry, published as CSS custom properties so the mat, its
 * beveled corners, and every overlay offset track the same breakpoint from one
 * place. Mat: 12px desktop / 6px mobile (12px eats too much of the photo at
 * ~390px). Bevel: 14px / 7px — scaled with the mat so the corner cuts stay
 * proportional to the frame at both sizes.
 *
 * Descendants of the tile frame inherit these for free; the select ring (a
 * sibling of the frame, not a descendant) sets them on itself via this same
 * mixin so it stays in lockstep.
 */
export const tileMatteVars = css`
  --tile-matte: 12px;
  --tile-bevel: 14px;
  ${({ theme }) => theme.breakpoints.mobile} {
    --tile-matte: 6px;
    --tile-bevel: 7px;
  }
`;

/**
 * Beveled corners for the tile mat — small diagonal cuts, like photo corner
 * mounts in an album (not a radius). `clip-path` clips the frame's border/inset
 * ring too, so those would break into open segments at each cut; the mat draws
 * its edge as part of the shape instead (see `printTileMatte`).
 */
const bevelPolygon = (b: string) => `polygon(
  ${b} 0, calc(100% - ${b}) 0,
  100% ${b}, 100% calc(100% - ${b}),
  calc(100% - ${b}) 100%, ${b} 100%,
  0 calc(100% - ${b}), 0 ${b}
)`;

/**
 * CALM tile matte — a warm-white mat with beveled corners and a continuous 1px
 * edge, so the photo reads as a small print. No shadow/stack/lift; tiles are
 * separated by the (deepened) grid gap instead.
 *
 * Edge-as-shape: the warm-dark tint fills the frame and the `::before` lays the
 * warm-white mat over all but a 1px beveled rim, so the edge reads as one
 * continuous line along the diagonal cuts. A plain border / inset ring would be
 * sliced into 4 open segments at the bevels.
 */
export const printTileMatte = css`
  ${tileMatteVars}
  position: relative;
  isolation: isolate;
  padding: ${TILE_MATTE_VAR};
  clip-path: ${bevelPolygon('var(--tile-bevel)')};
  background: rgba(58, 42, 28, 0.16);

  &::before {
    content: '';
    position: absolute;
    inset: 1px;
    z-index: -1;
    background: ${({ theme }) => theme.color.print};
    clip-path: ${bevelPolygon('var(--tile-bevel)')};
  }
`;

/**
 * THIN lightbox matte — a print resting on the dark viewer stage. Hugs the
 * image (the <img> box already tracks the photo aspect, so the matte does not
 * letterbox) with a warm drop shadow to lift it off the stage.
 */
export const printLightboxMatte = css`
  padding: 4px;
  background: ${({ theme }) => theme.color.print};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-shadow: ${({ theme }) => theme.boxShadow.print};
`;

const PrintMatte = styled.div`
  position: relative;
  display: block;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1)};
  background: ${({ theme }) => theme.color.print};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-shadow: ${({ theme }) => theme.boxShadow.print};
  transition: transform 160ms ease;
`;

/**
 * FULL cover print. The stacked sheets live on the root (transparent) as
 * negative-z pseudo-elements; the opaque matte is a normal-flow child painted
 * on top of them, so the sheets peek only where they extend past the card.
 */
const PrintRoot = styled.div`
  position: relative;
  display: block;
  box-sizing: border-box;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: ${({ theme }) => theme.color.print};
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    box-shadow: ${({ theme }) => theme.boxShadow.print};
  }
  &::before {
    transform: translate(-7px, 6px) rotate(-3deg);
  }
  &::after {
    transform: translate(7px, 6px) rotate(3deg);
  }

  @media (hover: hover) {
    &:hover ${PrintMatte} {
      transform: translateY(-2px);
    }
  }
`;

type PrintProps = {
  children: ReactNode;
  className?: string;
};

/** FULL cover treatment — warm matte, warm shadow, stacked sheets, hover lift. */
export const Print = ({ children, className }: PrintProps) => (
  <PrintRoot className={className}>
    <PrintMatte>{children}</PrintMatte>
  </PrintRoot>
);
