import { useState } from 'react';
import styled from 'styled-components';
import { Button, VStack } from '../../ui/Primitives';

type ShareTokenResultProps = {
  token: string;
  mediaId?: string;
  albumId?: string;
};

const buildShareUrl = (token: string): string => {
  if (typeof window === 'undefined') {
    return `/shared/${token}`;
  }
  return `${window.location.origin}/shared/${token}`;
};

export const ShareTokenResult = ({ token }: ShareTokenResultProps) => {
  const [copied, setCopied] = useState(false);
  const url = buildShareUrl(token);

  const handleCopy = async () => {
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
    <VStack gap={1}>
      <Label>Share link</Label>
      <Row>
        <ReadOnlyInput
          type="text"
          value={url}
          readOnly
          aria-label="Share URL"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button type="button" variant="secondary" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </Row>
    </VStack>
  );
};

const Label = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const Row = styled.div`
  display: flex;
  align-items: stretch;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const ReadOnlyInput = styled.input`
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  padding: 10px 12px;
  background: ${({ theme }) => theme.color.body};
  border: 1px solid ${({ theme }) => theme.color.border};
  color: ${({ theme }) => theme.color.bodyText};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
  }
`;
