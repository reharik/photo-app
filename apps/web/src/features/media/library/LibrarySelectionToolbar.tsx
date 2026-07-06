import { Heart, MoreHorizontal, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';
import { MaxWidthBreakpoint } from '../../../styles/theme';
import { AnchoredMenu } from '../../../ui/AnchoredMenu';
import { Button } from '../../../ui/Button';

type LibrarySelectionToolbarProps = {
  count: number;
  onCancel: () => void;
  availableActions: GalleryActionItems[];
};

/** Toolbar row: spacing(1.5) vertical padding ×2 + 32px icon/button row = 56px. */
export const LIBRARY_SELECTION_TOOLBAR_SLOT_HEIGHT = '56px';

const MOBILE_TOOLBAR_MEDIA = `(max-width: ${MaxWidthBreakpoint.Mobile}px)`;

const findAction = (actions: GalleryActionItems[], label: string): GalleryActionItems | undefined =>
  actions.find((a) => a.label === label);

export const LibrarySelectionToolbar = ({
  count,
  onCancel,
  availableActions,
}: LibrarySelectionToolbarProps) => {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowTriggerRef = useRef<HTMLButtonElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const isMobileToolbar = useMediaQuery(MOBILE_TOOLBAR_MEDIA);

  const shareAction = findAction(availableActions, 'Share');
  const addToAlbumAction = findAction(availableActions, 'Add to album');
  const deleteAction = findAction(availableActions, 'Delete from library');
  const label = isMobileToolbar
    ? count === 1
      ? '1 selected'
      : `${count} selected`
    : count === 1
      ? '1 item selected'
      : `${count} items selected`;

  const showOverflowMenu = isMobileToolbar || deleteAction != null || addToAlbumAction != null;

  useEffect(() => {
    if (!overflowOpen) {
      return;
    }
    const handleClick = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (
        overflowTriggerRef.current?.contains(target) ||
        overflowMenuRef.current?.contains(target)
      ) {
        return;
      }
      setOverflowOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [overflowOpen]);

  return (
    <Bar role="toolbar" aria-label="Selected items">
      <BarInner>
        <CountText>{label}</CountText>
        <ActionGroup>
          {shareAction ? (
            <Button
              type="button"
              variant="primary"
              size="small"
              leadingIcon={<Send size={14} strokeWidth={2} />}
              onClick={shareAction.onAction}
            >
              Share
            </Button>
          ) : null}
          {!isMobileToolbar && addToAlbumAction ? (
            <Button type="button" variant="ghost" size="small" onClick={addToAlbumAction.onAction}>
              Add to album
            </Button>
          ) : null}
          {!isMobileToolbar ? (
            <GhostIconButton type="button" aria-label="Favorite" disabled>
              <Heart size={18} strokeWidth={2} aria-hidden />
            </GhostIconButton>
          ) : null}
          {showOverflowMenu ? (
            <>
              <GhostIconButton
                ref={overflowTriggerRef}
                type="button"
                aria-label="More actions"
                aria-haspopup="true"
                aria-expanded={overflowOpen}
                onClick={() => setOverflowOpen((open) => !open)}
              >
                <MoreHorizontal size={18} strokeWidth={2} aria-hidden />
              </GhostIconButton>
              <AnchoredMenu
                open={overflowOpen}
                anchorRef={overflowTriggerRef}
                menuRef={overflowMenuRef}
                aria-label="More actions"
              >
                {isMobileToolbar && addToAlbumAction ? (
                  <OverflowMenuItem
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOverflowOpen(false);
                      addToAlbumAction.onAction();
                    }}
                  >
                    Add to album
                  </OverflowMenuItem>
                ) : null}
                {isMobileToolbar ? (
                  <OverflowMenuItem type="button" role="menuitem" disabled>
                    Favorite
                  </OverflowMenuItem>
                ) : null}
                {deleteAction ? (
                  <OverflowMenuItem
                    type="button"
                    role="menuitem"
                    $danger
                    onClick={() => {
                      setOverflowOpen(false);
                      deleteAction.onAction();
                    }}
                  >
                    Delete from library
                  </OverflowMenuItem>
                ) : null}
              </AnchoredMenu>
            </>
          ) : null}
          <CancelButton type="button" onClick={onCancel} aria-label="Clear selection">
            Cancel
          </CancelButton>
        </ActionGroup>
      </BarInner>
    </Bar>
  );
};

const Bar = styled.div`
  position: relative;
  z-index: 20;
  flex-shrink: 0;
  height: 100%;
`;

const BarInner = styled.div`
  max-width: 1400px;
  height: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};
  min-width: 0;

  @media (max-width: ${MaxWidthBreakpoint.Mobile}px) {
    gap: ${({ theme }) => theme.spacing(1)};
    padding: ${({ theme }) => `${theme.spacing(1.25)} ${theme.spacing(1.5)}`};
  }

  @media (max-width: 768px) and (min-width: ${MaxWidthBreakpoint.Mobile + 1}px) {
    padding: ${({ theme }) => `${theme.spacing(1.25)} ${theme.spacing(2)}`};
  }
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

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  flex-shrink: 0;
  justify-content: flex-end;

  @media (max-width: ${MaxWidthBreakpoint.Mobile}px) {
    gap: ${({ theme }) => theme.spacing(0.75)};
    flex-shrink: 1;
    min-width: 0;
  }
`;

const GhostIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.ghostButtonText};
  cursor: pointer;
  transition: color 0.15s ease;
  flex-shrink: 0;

  @media (max-width: ${MaxWidthBreakpoint.Mobile}px) {
    width: 28px;
    height: 28px;
  }

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const OverflowMenuItem = styled.button<{ $danger?: boolean }>`
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(0.75)} ${({ theme }) => theme.spacing(1.5)};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ $danger, theme }) => ($danger ? theme.color.textDanger : theme.color.bodyText)};
  font-size: ${({ theme }) => theme.fontSize._14};
  text-align: left;
  cursor: pointer;
  transition: background 0.1s ease;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 0;
  }
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
