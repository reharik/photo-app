import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { AnchoredMenu } from '../../../ui/AnchoredMenu';

export type RoleMenuItem = {
  key: string;
  label: ReactNode;
  selected?: boolean;
  danger?: boolean;
  /** Render a separator above this item. */
  dividerBefore?: boolean;
};

type RoleMenuProps = {
  /** Label shown on the trigger (the current role). */
  triggerLabel: ReactNode;
  items: RoleMenuItem[];
  onSelect: (key: string) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

/**
 * Inline role dropdown for a person row: text trigger + AnchoredMenu, following
 * the group-by picker pattern in AlbumSectionMetadata (outside-click close,
 * portal'd menu so it escapes the modal's overflow).
 */
export const RoleMenu = ({
  triggerLabel,
  items,
  onSelect,
  disabled,
  'aria-label': ariaLabel,
}: RoleMenuProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      <TriggerButton
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        {triggerLabel}
        <ChevronDown size={14} strokeWidth={2} aria-hidden />
      </TriggerButton>
      <AnchoredMenu open={open} anchorRef={triggerRef} menuRef={menuRef} aria-label={ariaLabel}>
        {items.map((item) => (
          <MenuItemButton
            key={item.key}
            type="button"
            role="menuitem"
            $danger={Boolean(item.danger)}
            $dividerBefore={Boolean(item.dividerBefore)}
            onClick={() => {
              setOpen(false);
              if (!item.selected) {
                onSelect(item.key);
              }
            }}
          >
            <MenuItemLabel>{item.label}</MenuItemLabel>
            {item.selected ? <Check size={14} strokeWidth={2} aria-hidden /> : null}
          </MenuItemButton>
        ))}
      </AnchoredMenu>
    </>
  );
};

const TriggerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: ${({ theme }) => theme.fontSize._13};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.bodyElevated};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.inputBorderFocus};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const MenuItemButton = styled.button<{ $danger: boolean; $dividerBefore: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  border: 0;
  background: transparent;
  color: ${({ theme, $danger }) => ($danger ? theme.color.formError : theme.color.bodyText)};
  font-size: ${({ theme }) => theme.fontSize._13};
  text-align: left;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  ${({ $dividerBefore, theme }) =>
    $dividerBefore
      ? `border-top: 1px solid ${theme.color.border}; border-top-left-radius: 0; border-top-right-radius: 0; margin-top: ${theme.spacing(0.5)};`
      : ''}

  &:hover {
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.inputBorderFocus};
    outline-offset: -2px;
  }
`;

const MenuItemLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;
