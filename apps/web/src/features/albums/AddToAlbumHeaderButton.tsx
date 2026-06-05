import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { AnchoredMenu } from '../../ui/AnchoredMenu';
import { Button } from '../../ui/Button';
import { ShellNavIconButton } from '../shell/ShellNavIconButton';
import { UploadMediaTrigger } from '../media/UploadMediaTrigger';

type AddToAlbumHeaderButtonProps = {
  albumId: string;
  disabled?: boolean;
  variant?: 'button' | 'icon';
  onAddFromLibrary: () => void;
};

export const AddToAlbumHeaderButton = ({
  albumId,
  disabled = false,
  variant = 'button',
  onAddFromLibrary,
}: AddToAlbumHeaderButtonProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClick = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <UploadMediaTrigger albumId={albumId} disabled={disabled}>
      {({ onPick, isUploading }) => (
        <>
          {variant === 'icon' ? (
            <ShellNavIconButton
              ref={triggerRef}
              type="button"
              aria-label="Add to album"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              disabled={disabled || isUploading}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Plus size={20} strokeWidth={2} aria-hidden />
            </ShellNavIconButton>
          ) : (
            <Button
              ref={triggerRef}
              type="button"
              variant="primary"
              size="large"
              loading={isUploading}
              disabled={disabled}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              Add to album
            </Button>
          )}
          <AnchoredMenu
            open={menuOpen}
            anchorRef={triggerRef}
            menuRef={menuRef}
            aria-label="Add to album"
          >
            <MenuItem
              type="button"
              role="menuitem"
              $emphasized
              onClick={() => {
                setMenuOpen(false);
                onAddFromLibrary();
              }}
            >
              Add from library
            </MenuItem>
            <MenuItem
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onPick();
              }}
            >
              Upload from device
            </MenuItem>
          </AnchoredMenu>
        </>
      )}
    </UploadMediaTrigger>
  );
};

const MenuItem = styled.button<{ $emphasized?: boolean }>`
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(0.75)} ${({ theme }) => theme.spacing(1.5)};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ $emphasized, theme }) =>
    $emphasized ? theme.weight.medium : theme.weight.regular};
  text-align: left;
  cursor: pointer;
  transition: background 0.1s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 0;
  }
`;
