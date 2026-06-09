import styled from 'styled-components';

type MediaGridSelectionToggleProps = {
  selected: boolean;
  selectionActive: boolean;
  onToggle: () => void;
};

/**
 * Top-right selection affordance on media grid tiles.
 * Desktop: hollow ring on hover before selection mode; always visible once selection starts.
 * Touch: always-visible ring with expanded hit target (no long-press).
 */
export const MediaGridSelectionToggle = ({
  selected,
  selectionActive,
  onToggle,
}: MediaGridSelectionToggleProps) => {
  return (
    <ToggleButton
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={selected ? 'Deselect' : 'Select'}
      $selected={selected}
      $selectionActive={selectionActive}
      onMouseDown={(e) => {
        if (e.button === 0) {
          e.preventDefault();
        }
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      {selected ? <CheckGlyph aria-hidden>✓</CheckGlyph> : null}
    </ToggleButton>
  );
};

const ToggleButton = styled.button<{ $selected: boolean; $selectionActive: boolean }>`
  position: absolute;
  top: ${({ $selected }) => ($selected ? '7px' : '8px')};
  right: ${({ $selected }) => ($selected ? '7px' : '8px')};
  width: ${({ $selected }) => ($selected ? '20px' : '18px')};
  height: ${({ $selected }) => ($selected ? '20px' : '18px')};
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  opacity: ${({ $selected, $selectionActive }) => ($selected || $selectionActive ? 1 : 0)};
  pointer-events: ${({ $selected, $selectionActive }) =>
    $selected || $selectionActive ? 'auto' : 'none'};

  @media (hover: none) and (pointer: coarse) {
    opacity: 1;
    pointer-events: auto;

    &::before {
      content: '';
      position: absolute;
      inset: -5px;
    }

    ${({ $selected }) =>
      !$selected
        ? `
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.15),
        0 1px 3px rgba(0, 0, 0, 0.4);
    `
        : ''}
  }

  @media (hover: hover) {
    [data-media-grid-selectable-thumb]:hover & {
      opacity: 1;
      pointer-events: auto;
    }
  }

  &:focus-visible {
    opacity: 1;
    pointer-events: auto;
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  ${({ $selected, theme }) =>
    $selected
      ? `
    border: none;
    background: ${theme.color.primaryButtonBg};
    color: ${theme.color.primaryButtonText};
  `
      : `
    /* White on image overlay — not theme page chrome. */
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    background: transparent;
    color: transparent;
  `}
`;

const CheckGlyph = styled.span`
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
`;
