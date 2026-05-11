import { type JSX, type KeyboardEvent, useRef, useState } from 'react';
import styled from 'styled-components';

const COMMENT_MAX_LENGTH = 500;
const COUNTER_THRESHOLD = COMMENT_MAX_LENGTH * 0.8;

type Props = {
  onSubmit: (body: string) => void | Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
};

export const CommentComposer = ({
  onSubmit,
  isLoading = false,
  placeholder = 'Add a comment…',
}: Props): JSX.Element => {
  const [body, setBody] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = body.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= COMMENT_MAX_LENGTH && !isLoading;
  const charCount = body.length;
  const showCounter = charCount >= COUNTER_THRESHOLD;

  const submit = (): void => {
    if (!canSubmit) return;
    void (async () => {
      await Promise.resolve(onSubmit(trimmed));
      setBody('');
      setFocused(false);
    })();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Root>
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          if (!body.trim()) setFocused(false);
        }}
        placeholder={placeholder}
        maxLength={COMMENT_MAX_LENGTH}
        rows={focused ? 3 : 1}
        disabled={isLoading}
        aria-label={placeholder}
      />
      {focused ? (
        <Footer>
          {showCounter ? (
            <CharCount $overLimit={charCount > COMMENT_MAX_LENGTH}>
              {charCount}/{COMMENT_MAX_LENGTH}
            </CharCount>
          ) : null}
          <Hint>⌘↵ to submit</Hint>
          <SubmitButton type="button" onClick={submit} disabled={!canSubmit}>
            {isLoading ? 'Posting…' : 'Post'}
          </SubmitButton>
        </Footer>
      ) : null}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.75)};
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
    color: ${({ theme }) => theme.color.inputDisabledText};
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const CharCount = styled.span<{ $overLimit: boolean }>`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ $overLimit, theme }) =>
    $overLimit ? theme.color.textDanger : theme.color.textMuted};
`;

const Hint = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.textMuted};
  user-select: none;
`;

const SubmitButton = styled.button`
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(2)};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.primaryButtonText};
  cursor: pointer;
  transition: background 0.15s ease;

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
