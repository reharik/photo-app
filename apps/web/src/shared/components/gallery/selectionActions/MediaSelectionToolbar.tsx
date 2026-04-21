import styled from 'styled-components';

type MediaSelectionToolbarProps = {
  /** When set, shows an enabled “Add to album” control. */
  onAddToAlbum?: () => void;
  /** Album detail only: remove selected album items from the current album (does not delete media). */
  onRemoveFromAlbum?: () => void;
};

/**
 * Actions for media-oriented grids (recent media, album detail). Omits “Add to album” when `onAddToAlbum` is omitted (e.g. album list).
 */
export const MediaSelectionToolbar = ({
  onAddToAlbum,
  onRemoveFromAlbum,
}: MediaSelectionToolbarProps) => {
  return (
    <>
      <ToolbarAction type="button" disabled title="Coming soon">
        Share
      </ToolbarAction>
      {onAddToAlbum ? (
        <ToolbarAction type="button" onClick={onAddToAlbum}>
          Add to album
        </ToolbarAction>
      ) : null}
      {onRemoveFromAlbum ? (
        <ToolbarAction type="button" onClick={onRemoveFromAlbum}>
          Remove from album
        </ToolbarAction>
      ) : null}
      <ToolbarAction type="button" disabled title="Coming soon">
        Delete
      </ToolbarAction>
    </>
  );
};

const ToolbarAction = styled.button`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.subtext};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.text};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;
