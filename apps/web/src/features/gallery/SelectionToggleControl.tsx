import styled from 'styled-components';

type SelectionToggleControlProps = {
  selected: boolean;
  onToggle: () => void;
};

/**
 * Google Photos–style: hollow ring on thumb hover; filled + check when selected.
 * Plain click toggles selection (no Ctrl/Shift). Parent should use [data-selectable-thumb] on the thumb container.
 */
export const SelectionToggleControl = ({ selected, onToggle }: SelectionToggleControlProps) => {
  return (
    <ToggleButton
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={selected ? 'Deselect' : 'Select'}
      $selected={selected}
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
      <ToggleGlyph $selected={selected}>{selected ? '✓' : null}</ToggleGlyph>
    </ToggleButton>
  );
};

const ToggleButton = styled.button<{ $selected: boolean }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing(1)};
  left: ${({ theme }) => theme.spacing(1)};
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${({ $selected }) => ($selected ? 1 : 0)};
  pointer-events: ${({ $selected }) => ($selected ? 'auto' : 'none')};

  /* Pointer hover on this thumb only — not :focus-within (avoids ring stuck when moving to another tile) */
  [data-selectable-thumb]:hover & {
    opacity: 1;
    pointer-events: auto;
  }

  &:focus-visible {
    opacity: 1;
    pointer-events: auto;
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const ToggleGlyph = styled.span<{ $selected: boolean }>`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);

  ${({ $selected, theme }) =>
    $selected
      ? `
    background: ${theme.color.primaryButtonBg};
    color: ${theme.color.body};
    border: none;
  `
      : `
    background: rgba(0, 0, 0, 0.35);
    border: 2px solid rgba(255, 255, 255, 0.92);
    color: transparent;
  `}
`;
