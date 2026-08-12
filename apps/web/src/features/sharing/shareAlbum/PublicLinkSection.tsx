import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../ui/Button';

/**
 * Album.publicLink is nullable: null means never created, and the modal must
 * never mint one just because it was opened (a read with a write side-effect
 * would give every album a live public token). So 'absent' renders a create
 * BUTTON — a disabled "unavailable" field reads as broken — and only once a
 * link exists does the read-only URL field appear.
 */
export type PublicLinkState =
  | { kind: 'loading' }
  /** The extras query degraded (resolver missing / errored) — no create offer. */
  | { kind: 'unavailable' }
  | { kind: 'absent' }
  | { kind: 'present'; url: string };

type PublicLinkSectionProps = {
  link: PublicLinkState;
  creating: boolean;
  onCreate: () => void;
  onRequestReset: () => void;
};

export const PublicLinkSection = ({
  link,
  creating,
  onCreate,
  onRequestReset,
}: PublicLinkSectionProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (url: string) => {
    if (!navigator.clipboard) {
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
      {link.kind === 'loading' ? (
        <Muted>Loading…</Muted>
      ) : link.kind === 'unavailable' ? (
        <Muted>Public link unavailable right now.</Muted>
      ) : link.kind === 'absent' ? (
        <div>
          <Button
            type="button"
            variant="secondary"
            size="small"
            loading={creating}
            onClick={onCreate}
          >
            Create a link anyone can view
          </Button>
        </div>
      ) : (
        <>
          <Row>
            <ReadOnlyInput
              type="text"
              value={link.url}
              readOnly
              aria-label="Public link URL"
              onFocus={(event) => event.currentTarget.select()}
            />
            <CopyButton
              type="button"
              aria-label={copied ? 'Link copied' : 'Copy link'}
              title="Copy link"
              onClick={() => void handleCopy(link.url)}
            >
              {copied ? (
                <Check size={16} strokeWidth={2} aria-hidden />
              ) : (
                <Copy size={16} strokeWidth={2} aria-hidden />
              )}
            </CopyButton>
            {/* One click, not a menu wrapping a single action — the confirm
                dialog carries the weight of the destruction. */}
            <ResetButton
              type="button"
              aria-label="Reset public link"
              title="Reset public link"
              onClick={onRequestReset}
            >
              Reset…
            </ResetButton>
          </Row>
          <Hint>Anyone with the link can view this album.</Hint>
        </>
      )}
    </Block>
  );
};

const Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.color.borderSubtle};
`;

const SectionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  font-weight: ${({ theme }) => theme.weight.medium};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.bodyTextMuted};
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
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 0;
  color: ${({ theme }) => theme.color.bodyText};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.fontSize._13};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.color.inputBorderFocus};
    outline-offset: -1px;
  }
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ theme }) => theme.spacing(4)};
  height: ${({ theme }) => theme.spacing(4)};
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
`;

const ResetButton = styled.button`
  flex-shrink: 0;
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: ${({ theme }) => theme.fontSize._13};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.color.bodyElevated};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.inputBorderFocus};
    outline-offset: 1px;
  }
`;

const Muted = styled.div`
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.bodyTextMuted};
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._12};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
