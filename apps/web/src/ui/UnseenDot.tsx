import styled from 'styled-components';

type UnseenDotProps = {
  /** Diameter in px. Default 10. */
  size?: number;
  /** Offset from the top edge in px (may be negative to overhang). Default 8. */
  top?: number;
  /** Offset from the right edge in px (may be negative to overhang). Default 8. */
  right?: number;
  className?: string;
};

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

const Dot = styled.span<{ $size: number; $top: number; $right: number }>`
  position: absolute;
  top: ${({ $top }) => $top}px;
  right: ${({ $right }) => $right}px;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ theme }) => theme.color.unseen};
  /* Paper-colored ring keeps the dot legible over busy photo covers. */
  box-shadow: 0 0 0 2px ${({ theme }) => theme.color.body};
  pointer-events: none;
`;
