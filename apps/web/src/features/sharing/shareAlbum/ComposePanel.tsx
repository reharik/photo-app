import { X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../../domain/errors/errorTypes';
import type { ShareContactType } from '../../../graphql/generated/types';
import { AppErrorPanel } from '../../../ui/AppErrorPanel';
import { FormInput } from '../../../ui/FormInput';
import { MultiCombobox, type MultiComboboxOption } from '../../../ui/MultiCombobox';
import { Button, VStack } from '../../../ui/Primitives';
import type { ShareAccessLevel } from './preSdlShareDocuments';
import { RoleMenu, type RoleMenuItem } from './RoleMenu';
import { ACCESS_LEVEL_LABELS, EMAIL_SEPARATORS, type PendingRecipient } from './shareAlbumTypes';

type ComposePanelProps = {
  recipients: PendingRecipient[];
  suggestions: ShareContactType[];
  message: string;
  sending: boolean;
  /** Cumulative count of recipients shared successfully this compose session. */
  sentCount: number;
  /** Whole-operation mutation failures (auth, validation) — not per-recipient. */
  envelopeErrors: AppError[];
  onAddEmails: (emails: string[]) => void;
  onMessageChange: (value: string) => void;
  onChangeAccessLevel: (email: string, level: ShareAccessLevel) => void;
  onRemoveRecipient: (email: string) => void;
  onRetryRecipient: (email: string) => void;
  onRetryAll: () => void;
  onDeleteContact: (handle: string) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (input: string): string => input.trim().toLowerCase();

const validateEmail = (input: string): string | undefined => {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'Enter an email address';
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Enter a valid email address';
  }
  return undefined;
};

/** Role options for a resolved account, in design order. */
const ACCOUNT_ACCESS_LEVELS: ShareAccessLevel[] = ['CONTRIBUTOR', 'VIEWER', 'ADMIN'];

/**
 * COMPOSE mode: pending recipients resolved against the server. Resolved
 * accounts get a role dropdown; unresolved emails are pinned to a static
 * "Can view" — membership requires an active account, so the membership options
 * must not render at all for them (not even disabled).
 */
export const ComposePanel = ({
  recipients,
  suggestions,
  message,
  sending,
  sentCount,
  envelopeErrors,
  onAddEmails,
  onMessageChange,
  onChangeAccessLevel,
  onRemoveRecipient,
  onRetryRecipient,
  onRetryAll,
  onDeleteContact,
}: ComposePanelProps) => {
  const [inputSelection] = useState<MultiComboboxOption[]>([]);

  const suggestionOptions = useMemo(
    () =>
      suggestions
        .map((contact) => ({
          value: normalizeEmail(contact.handle),
          display: normalizeEmail(contact.handle),
        }))
        .filter((option) => !recipients.some((recipient) => recipient.email === option.value)),
    [suggestions, recipients],
  );

  const handleInputChange = useCallback(
    (next: MultiComboboxOption[]) => {
      if (next.length > 0) {
        onAddEmails(next.map((option) => option.value));
      }
    },
    [onAddEmails],
  );

  const createRecipientItem = useCallback((input: string): MultiComboboxOption => {
    const normalized = normalizeEmail(input);
    return { value: normalized, display: normalized };
  }, []);

  const failedRecipients = recipients.filter((recipient) => recipient.sendState === 'failed');
  const retryableFailures = failedRecipients.filter((recipient) => recipient.error?.retryable);
  const showSummary = sentCount > 0 || failedRecipients.length > 0;

  const accessLevelItems = (recipient: PendingRecipient): RoleMenuItem[] =>
    ACCOUNT_ACCESS_LEVELS.map((level) => ({
      key: level,
      label: ACCESS_LEVEL_LABELS[level],
      selected: recipient.accessLevel === level,
    }));

  return (
    <VStack gap={3}>
      <AppErrorPanel errors={envelopeErrors} />
      <MultiCombobox
        value={inputSelection}
        onChange={handleInputChange}
        items={suggestionOptions}
        allowCustomValue
        validateEntry={validateEmail}
        createCustomItem={createRecipientItem}
        separators={EMAIL_SEPARATORS}
        placeholder="Add another email"
        disabled={sending}
        onDeleteItem={onDeleteContact}
        deleteItemLabel="Remove from saved contacts"
      />

      {showSummary ? (
        <SummaryRow>
          <SummaryText>
            {sentCount > 0 ? `${sentCount} shared` : null}
            {sentCount > 0 && failedRecipients.length > 0 ? ', ' : null}
            {failedRecipients.length > 0 ? `${failedRecipients.length} failed` : null}
          </SummaryText>
          {retryableFailures.length > 1 ? (
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={onRetryAll}
              disabled={sending}
            >
              Retry all
            </Button>
          ) : null}
        </SummaryRow>
      ) : null}

      <RowList>
        {recipients.map((recipient) => {
          const isFailed = recipient.sendState === 'failed';
          const isSending = recipient.sendState === 'sending';
          return (
            <RecipientRow key={recipient.email} $failed={isFailed}>
              <RecipientText>
                <RecipientName>
                  {recipient.resolution === 'account' && recipient.displayName
                    ? recipient.displayName
                    : recipient.email}
                </RecipientName>
                {isFailed && recipient.error ? (
                  <RecipientError role="alert">{recipient.error.message}</RecipientError>
                ) : recipient.resolution === 'pending' ? (
                  <RecipientSub>Checking for an account…</RecipientSub>
                ) : recipient.resolution === 'noAccount' ? (
                  <RecipientSub>No account — gets a view link</RecipientSub>
                ) : recipient.displayName ? (
                  <RecipientSub>{recipient.email}</RecipientSub>
                ) : null}
              </RecipientText>
              <RecipientActions>
                {isFailed ? (
                  <>
                    {recipient.error?.retryable ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        disabled={sending}
                        onClick={() => onRetryRecipient(recipient.email)}
                      >
                        Retry
                      </Button>
                    ) : null}
                    <RemoveRowButton
                      type="button"
                      aria-label={`Dismiss ${recipient.email}`}
                      title="Dismiss"
                      disabled={sending}
                      onClick={() => onRemoveRecipient(recipient.email)}
                    >
                      <X size={16} strokeWidth={2} aria-hidden />
                    </RemoveRowButton>
                  </>
                ) : (
                  <>
                    {recipient.resolution === 'account' ? (
                      <RoleMenu
                        triggerLabel={ACCESS_LEVEL_LABELS[recipient.accessLevel]}
                        items={accessLevelItems(recipient)}
                        disabled={sending || isSending}
                        aria-label={`Access level for ${recipient.email}`}
                        onSelect={(key) =>
                          onChangeAccessLevel(recipient.email, key as ShareAccessLevel)
                        }
                      />
                    ) : recipient.resolution === 'noAccount' ? (
                      <StaticLevel>{ACCESS_LEVEL_LABELS.VIEWER}</StaticLevel>
                    ) : null}
                    <RemoveRowButton
                      type="button"
                      aria-label={`Remove ${recipient.email}`}
                      title="Remove"
                      disabled={sending || isSending}
                      onClick={() => onRemoveRecipient(recipient.email)}
                    >
                      <X size={16} strokeWidth={2} aria-hidden />
                    </RemoveRowButton>
                  </>
                )}
              </RecipientActions>
            </RecipientRow>
          );
        })}
      </RowList>

      <FormInput
        as="textarea"
        label="Message (optional)"
        rows={3}
        value={message}
        disabled={sending}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
          onMessageChange(event.target.value)
        }
      />
    </VStack>
  );
};

const RowList = styled.div`
  display: flex;
  flex-direction: column;
`;

const RecipientRow = styled.div<{ $failed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(1)} 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.border};
  }
`;

const RecipientText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.25)};
  min-width: 0;
`;

const RecipientName = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.bodyText};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RecipientSub = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const RecipientError = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.formError};
`;

const RecipientActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-shrink: 0;
`;

const StaticLevel = styled.span`
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
`;

const RemoveRowButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing(3.5)};
  height: ${({ theme }) => theme.spacing(3.5)};
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextMuted};
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

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SummaryText = styled.span`
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
