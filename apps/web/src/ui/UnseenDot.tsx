import styled from 'styled-components';

type UnseenDotProps = {
  /** Diameter in px. Default 10. */
  size?: number;
  /** Offset from the top edge. Number = px (may be negative to overhang), or a
   * CSS length string (e.g. `calc(var(--tile-matte) + 8px)`). Default 8. */
  top?: number | string;
  /** Offset from the right edge. Number = px, or a CSS length string. Default 8. */
  right?: number | string;
  className?: string;
};

const toLength = (v: number | string): string => (typeof v === 'number' ? `${v}px` : v);

/**
 * Binary unseen-activity indicator — a small solid red circle pinned to the
 * top-right corner of its container. The container MUST be `position: relative`.
 * Used at every level (album card, nav, future media items) so the visual stays
 * consistent. No counts: the data is a boolean.
 */
export const UnseenDot = ({ size = 10, top = 8, right = 8, className }: UnseenDotProps) => (
  <Dot
    role="status"
    aria-label="Unseen activity"
    className={className}
    $size={size}
    $top={top}
    $right={right}
  />
);

const Dot = styled.span<{ $size: number; $top: number | string; $right: number | string }>`
  position: absolute;
  top: ${({ $top }) => toLength($top)};
  right: ${({ $right }) => toLength($right)};
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.unseen};
  /* Paper-colored ring keeps the dot legible over busy photo covers. */
  box-shadow: 0 0 0 2px ${({ theme }) => theme.color.body};
  pointer-events: none;
`;
