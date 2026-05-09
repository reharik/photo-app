import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const COMMENT_MAX_LENGTH = 500;
const COUNTER_THRESHOLD = COMMENT_MAX_LENGTH * 0.8;

type Props = {
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export const ReplyComposer = ({ onSubmit, onCancel, isLoading }: Props) => {
  const [body, setBody] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= COMMENT_MAX_LENGTH && !isLoading;
  const charCount = body.length;
  const showCounter = charCount >= COUNTER_THRESHOLD;

  const submit = async () => {
    if (!canSubmit) return;
    await onSubmit(trimmed);
    setBody('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <Root>
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a reply…"
        maxLength={COMMENT_MAX_LENGTH}
        rows={2}
        disabled={isLoading}
        aria-label="Add a reply"
      />
      <Footer>
        {showCounter && (
          <CharCount $overLimit={charCount > COMMENT_MAX_LENGTH}>
            {charCount}/{COMMENT_MAX_LENGTH}
          </CharCount>
        )}
        <Actions>
          <CancelButton type="button" onClick={onCancel} disabled={isLoading}>
            Cancel
          </CancelButton>
          <ReplyButton type="button" onClick={() => void submit()} disabled={!canSubmit}>
            {isLoading ? 'Posting…' : 'Reply'}
          </ReplyButton>
        </Actions>
      </Footer>
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.75)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const Textarea = styled.textarea`
  width: 100%;
  resize: none;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.25)};
  border: 1px solid ${({ theme }) => theme.color.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.inputBg};
  color: ${({ theme }) => theme.color.inputText};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-family: inherit;
  line-height: 1.5;
  box-sizing: border-box;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &::placeholder {
    color: ${({ theme }) => theme.color.inputPlaceholder};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.inputBorderFocus};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color.inputBorderFocus}33;
  }

  &:disabled {
    background: ${({ theme }) => theme.color.inputDisabledBg};
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const CharCount = styled.span<{ $overLimit: boolean }>`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ $overLimit, theme }) =>
    $overLimit ? theme.color.textDanger : theme.color.textMuted};
  margin-right: auto;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const CancelButton = styled.button`
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1.5)};
  font-size: ${({ theme }) => theme.fontSize._14};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.bodyRaised};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ReplyButton = styled.button`
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1.5)};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.primaryButtonText};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:disabled {
    background: ${({ theme }) => theme.color.buttonDisabled};
    color: ${({ theme }) => theme.color.buttonDisabledText};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;
