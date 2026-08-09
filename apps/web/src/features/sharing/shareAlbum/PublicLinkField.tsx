import { Check, Copy, EllipsisVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { AnchoredMenu } from '../../../ui/AnchoredMenu';

type PublicLinkFieldProps = {
  /** Undefined while loading or until the backend read path exists (PRE-SDL). */
  token: string | undefined;
  onRequestReset: () => void;
  disabled?: boolean;
};

const buildShareUrl = (token: string): string => {
  if (typeof window === 'undefined') {
    return `/shared/${token}`;
  }
  return `${window.location.origin}/shared/${token}`;
};

/**
 * The persistent public link: read-only URL + inline copy affordance + overflow
 * menu holding "Reset link". The link is never created from here — it exists as
 * long as the album does (server-side get-or-create), which is why this is a
 * field and not a button.
 */
export const PublicLinkField = ({ token, onRequestReset, disabled }: PublicLinkFieldProps) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const overflowRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const url = token ? buildShareUrl(token) : undefined;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClick = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (overflowRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleCopy = async () => {
    if (!url || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Block>
      <SectionLabel>Public link</SectionLabel>
      <Row>
        <ReadOnlyInput
          type="text"
          value={url ?? 'Public link unavailable'}
          readOnly
          disabled={!url}
          aria-label="Public link URL"
          onFocus={(event) => event.currentTarget.select()}
        />
        <IconButton
          type="button"
          aria-label={copied ? 'Link copied' : 'Copy link'}
          title="Copy link"
          disabled={disabled || !url}
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <Check size={16} strokeWidth={2} aria-hidden />
          ) : (
            <Copy size={16} strokeWidth={2} aria-hidden />
          )}
        </IconButton>
        <IconButton
          ref={overflowRef}
          type="button"
          aria-label="Public link options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={disabled}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <EllipsisVertical size={16} strokeWidth={2} aria-hidden />
        </IconButton>
        <AnchoredMenu
          open={menuOpen}
          anchorRef={overflowRef}
          menuRef={menuRef}
          aria-label="Public link options"
        >
          <OverflowItem
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onRequestReset();
            }}
          >
            Reset link…
          </OverflowItem>
        </AnchoredMenu>
      </Row>
      <Hint>Anyone with the link can view this album.</Hint>
    </Block>
  );
};

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.color.border};
`;

const SectionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.bodyText};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const ReadOnlyInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  background: ${({ theme }) => theme.color.body};
  border: 1px solid ${({ theme }) => theme.color.border};
  color: ${({ theme }) => theme.color.bodyText};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.fontSize._13};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.inputBorderFocus};
  }

  &:disabled {
    color: ${({ theme }) => theme.color.bodyTextMuted};
    font-family: inherit;
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ theme }) => theme.spacing(4.5)};
  height: ${({ theme }) => theme.spacing(4.5)};
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  cursor: pointer;

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
    opacity: 0.5;
  }
`;

const OverflowItem = styled.button`
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  font-size: ${({ theme }) => theme.fontSize._13};
  text-align: left;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  &:hover {
    background: ${({ theme }) => theme.color.bodyElevated};
  }
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._12};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
