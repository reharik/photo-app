import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

type Props = {
  canReply: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export const CommentActions = ({
  canReply,
  canEdit,
  canDelete,
  onReply,
  onEdit,
  onDelete,
}: Props) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const showReply = canReply && !!onReply;
  const showEdit = canEdit && !!onEdit;
  const showDelete = canDelete && !!onDelete;
  const hasMenuItems = showEdit || showDelete;

  if (!showReply && !hasMenuItems) {
    return null;
  }

  return (
    <Root ref={rootRef}>
      {showReply ? (
        <ReplyButton type="button" onClick={onReply}>
          Reply
        </ReplyButton>
      ) : null}
      {hasMenuItems ? (
        <>
          <KebabButton
            type="button"
            aria-label="Comment actions"
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ···
          </KebabButton>
          {open ? (
            <Menu role="menu" aria-label="Comment actions">
              {showEdit ? (
                <MenuItem
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onEdit?.();
                  }}
                >
                  Edit
                </MenuItem>
              ) : null}
              {showDelete ? (
                <MenuItem
                  type="button"
                  role="menuitem"
                  $danger
                  onClick={() => {
                    setOpen(false);
                    onDelete?.();
                  }}
                >
                  Delete
                </MenuItem>
              ) : null}
            </Menu>
          ) : null}
        </>
      ) : null}
    </Root>
  );
};

const Root = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  opacity: 0;
  transition: opacity 0.1s ease;

  @media (hover: none) {
    opacity: 1;
  }
`;

export const CommentActionsRevealWrapper = styled.div`
  &:hover ${Root}, &:focus-within ${Root} {
    opacity: 1;
  }
`;

const ReplyButton = styled.button`
  padding: ${({ theme }) => theme.spacing(0.25)} ${({ theme }) => theme.spacing(0.75)};
  font-size: ${({ theme }) => theme.fontSize._12};
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.textMuted};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const KebabButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: 16px;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  line-height: 1;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
    background: ${({ theme }) => theme.color.bodyElevated};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 120px;
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.bodyRaised};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
  z-index: 20;
`;

const MenuItem = styled.button<{ $danger?: boolean }>`
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
