import { Heart, MoreHorizontal, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';

type LibrarySelectionToolbarProps = {
  count: number;
  onCancel: () => void;
  availableActions: GalleryActionItems[];
};

/** Toolbar row: spacing(1.5) vertical padding ×2 + 32px icon/button row = 56px. */
export const LIBRARY_SELECTION_TOOLBAR_SLOT_HEIGHT = '56px';

const findAction = (
  actions: GalleryActionItems[],
  label: string,
): GalleryActionItems | undefined => actions.find((a) => a.label === label);

export const LibrarySelectionToolbar = ({
  count,
  onCancel,
  availableActions,
}: LibrarySelectionToolbarProps) => {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  const shareAction = findAction(availableActions, 'Share');
  const addToAlbumAction = findAction(availableActions, 'Add to album');
  const deleteAction = findAction(availableActions, 'Delete from library');
  const label = count === 1 ? '1 photo selected' : `${count} photos selected`;

  useEffect(() => {
    if (!overflowOpen) {
      return;
    }
    const handleClick = (e: MouseEvent): void => {
      if (!overflowRef.current?.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
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
            <ShareButton type="button" onClick={shareAction.onAction}>
              <Send size={14} strokeWidth={2} aria-hidden />
              Share
            </ShareButton>
          ) : null}
          {addToAlbumAction ? (
            <GhostTextButton type="button" onClick={addToAlbumAction.onAction}>
              Add to album
            </GhostTextButton>
          ) : null}
          {/* TODO: wire favorite/like toggle when a bulk-favorite mutation exists */}
          <GhostIconButton type="button" aria-label="Favorite" disabled>
            <Heart size={18} strokeWidth={2} aria-hidden />
          </GhostIconButton>
          {deleteAction ? (
            <OverflowMenuRoot ref={overflowRef}>
              <GhostIconButton
                type="button"
                aria-label="More actions"
                aria-haspopup="true"
                aria-expanded={overflowOpen}
                onClick={() => setOverflowOpen((open) => !open)}
              >
                <MoreHorizontal size={18} strokeWidth={2} aria-hidden />
              </GhostIconButton>
              {overflowOpen ? (
                <OverflowMenu role="menu" aria-label="More actions">
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
                </OverflowMenu>
              ) : null}
            </OverflowMenuRoot>
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

  @media (max-width: 768px) {
    padding: ${({ theme }) => `${theme.spacing(1.25)} ${theme.spacing(2)}`};
    flex-wrap: wrap;
  }
`;

const CountText = styled.span`
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.bodyText};
  min-width: 0;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const ShareButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => `${theme.spacing(0.75)} ${theme.spacing(2)}`};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.primaryButtonText};
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.medium};
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const GhostTextButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing(0.75)} ${theme.spacing(1)}`};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.ghostButtonText};
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.medium};
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
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

const OverflowMenuRoot = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const OverflowMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 180px;
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.bodyRaised};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
  z-index: 40;
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

  &:hover {
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

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;
