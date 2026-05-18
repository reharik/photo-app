import styled from 'styled-components';

type MediaSelectionToolbarProps = {
  /** When set, shows an enabled “Share” control for the current selection. */
  onShare?: () => void;
  /** When set, shows an enabled “Add to album” control. */
  onAddToAlbum?: () => void;
  /** Album detail only: remove selected album items from the current album (does not delete media). */
  onRemoveFromAlbum?: () => void;
  /** Media library grids: permanently delete selected media (by media item id). */
  onDeleteFromLibrary?: () => void;
  /** Cancel the selection. */
  onCancel?: () => void;
};

/**
 * Actions for media-oriented grids (recent media, album detail, picker).
 * Each action is shown only when the corresponding callback is provided (callers gate with
 * `canEveryItemDo` and `operations` from the API).
 */
export const MediaSelectionToolbar = ({
  onShare,
  onAddToAlbum,
  onRemoveFromAlbum,
  onDeleteFromLibrary,
  onCancel,
}: MediaSelectionToolbarProps) => {
  return (
    <>
      {onShare ? (
        <ToolbarAction type="button" onClick={onShare}>
          Share
        </ToolbarAction>
      ) : null}
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
      {onDeleteFromLibrary ? (
        <ToolbarAction type="button" onClick={onDeleteFromLibrary}>
          Delete
        </ToolbarAction>
      ) : null}
      {onCancel ? (
        <ToolbarAction type="button" onClick={onCancel}>
          Cancel
        </ToolbarAction>
      ) : null}
    </>
  );
};

const ToolbarAction = styled.button`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;
