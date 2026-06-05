import styled from 'styled-components';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { GalleryActionItems } from '../../hooks/useMultiSelectGallery';
import { MaxWidthBreakpoint } from '../../styles/theme';
import { Button } from '../../ui/Button';

type AlbumSelectionActionsProps = {
  selectionCount: number;
  onClearSelection: () => void;
  selectionActions: GalleryActionItems[];
};

const MOBILE_ACTIONS_MEDIA = `(max-width: ${MaxWidthBreakpoint.Mobile}px)`;

const findAction = (
  actions: GalleryActionItems[],
  label: string,
): GalleryActionItems | undefined => actions.find((a) => a.label === label);

export const AlbumSelectionActions = ({
  selectionCount,
  onClearSelection,
  selectionActions,
}: AlbumSelectionActionsProps) => {
  const isMobileActions = useMediaQuery(MOBILE_ACTIONS_MEDIA);
  const removeAction = findAction(selectionActions, 'Remove from album');

  const selectionLabel = isMobileActions
    ? selectionCount === 1
      ? '1 selected'
      : `${selectionCount} selected`
    : selectionCount === 1
      ? '1 photo selected'
      : `${selectionCount} photos selected`;

  if (isMobileActions) {
    return (
      <MobileRoot role="toolbar" aria-label="Selected album items">
        <MobileToolbarRow>
          <CountText>{selectionLabel}</CountText>
          <CancelButton type="button" onClick={onClearSelection} aria-label="Clear selection">
            Cancel
          </CancelButton>
        </MobileToolbarRow>
        {removeAction ? (
          <Button
            type="button"
            variant="ghost"
            size="small"
            fullWidth
            onClick={removeAction.onAction}
          >
            Remove from album
          </Button>
        ) : null}
      </MobileRoot>
    );
  }

  return (
    <DesktopBar role="toolbar" aria-label="Selected album items">
      <CountText>{selectionLabel}</CountText>
      <ActionGroup>
        {removeAction ? (
          <Button type="button" variant="ghost" size="small" onClick={removeAction.onAction}>
            Remove from album
          </Button>
        ) : null}
        <CancelButton type="button" onClick={onClearSelection} aria-label="Clear selection">
          Cancel
        </CancelButton>
      </ActionGroup>
    </DesktopBar>
  );
};

const MobileRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  min-width: 0;
`;

const MobileToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  min-width: 0;
`;

const DesktopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  min-width: 0;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  flex-shrink: 0;
  justify-content: flex-end;
`;

const CountText = styled.span`
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.bodyText};
  min-width: 0;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CancelButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing(0.75)} ${theme.spacing(1)}`};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.medium};
  cursor: pointer;
  transition: color 0.15s ease;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;
