import { type JSX, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const COMMENT_MAX_LENGTH = 500;

type CommentBodyDisplay = {
  body: string;
};

type Props = {
  comment: CommentBodyDisplay;
  isEditing: boolean;
  onSave?: (newBody: string) => void | Promise<void>;
  onCancelEdit?: () => void;
  isSaving?: boolean;
};

export const CommentBody = ({
  comment,
  isEditing,
  onSave,
  onCancelEdit,
  isSaving = false,
}: Props): JSX.Element => {
  const { body } = comment;
  const [draft, setDraft] = useState(body);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(body);
      setTimeout(() => {
        textareaRef.current?.focus();
        const len = textareaRef.current?.value.length ?? 0;
        textareaRef.current?.setSelectionRange(len, len);
      }, 0);
    }
  }, [isEditing, body]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Escape' && !isSaving) {
      e.preventDefault();
      onCancelEdit?.();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const trimmed = draft.trim();
      if (!isSaving && trimmed && trimmed !== body && onSave) {
        void Promise.resolve(onSave(trimmed));
      }
    }
  };

  if (!isEditing) {
    return <BodyText>{body}</BodyText>;
  }

  const trimmed = draft.trim();
  const canSave =
    trimmed.length > 0 &&
    trimmed !== body &&
    trimmed.length <= COMMENT_MAX_LENGTH &&
    !!onSave &&
    !isSaving;
  const charCount = draft.length;
  const showCounter = charCount >= COMMENT_MAX_LENGTH * 0.8;

  return (
    <EditRoot>
      <EditTextarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={COMMENT_MAX_LENGTH}
        rows={3}
        disabled={isSaving}
        aria-label="Edit comment"
      />
      <EditFooter>
        {showCounter ? (
          <CharCount $overLimit={charCount > COMMENT_MAX_LENGTH}>
            {charCount}/{COMMENT_MAX_LENGTH}
          </CharCount>
        ) : null}
        <EditActions>
          <CancelButton type="button" onClick={() => onCancelEdit?.()} disabled={isSaving}>
            Cancel
          </CancelButton>
          <SaveButton
            type="button"
            onClick={() => canSave && onSave && void Promise.resolve(onSave(trimmed))}
            disabled={!canSave}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </SaveButton>
        </EditActions>
      </EditFooter>
    </EditRoot>
  );
};

const BodyText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
`;

const EditRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.75)};
`;

const EditTextarea = styled.textarea`
  width: 100%;
  resize: vertical;
  padding: ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ theme }) => theme.color.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.color.inputBg};
  color: ${({ theme }) => theme.color.inputText};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-family: inherit;
  line-height: 1.5;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.inputBorderFocus};
  }
`;

const EditFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const CharCount = styled.span<{ $overLimit: boolean }>`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ $overLimit, theme }) =>
    $overLimit ? theme.color.textDanger : theme.color.textMuted};
`;

const EditActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-left: auto;
`;

const CancelButton = styled.button`
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1.5)};
  font-size: ${({ theme }) => theme.fontSize._12};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.bodyRaised};
  }
`;

const SaveButton = styled.button`
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1.5)};
  font-size: ${({ theme }) => theme.fontSize._12};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.primaryButtonText};
  cursor: pointer;
  font-weight: ${({ theme }) => theme.weight.medium};

  &:disabled {
    background: ${({ theme }) => theme.color.buttonDisabled};
    color: ${({ theme }) => theme.color.buttonDisabledText};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }
`;
