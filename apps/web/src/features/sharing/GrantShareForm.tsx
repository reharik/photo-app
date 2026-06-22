import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../domain/errors/errorTypes';

import { Operation } from '@packages/contracts';
import { DateTime } from 'luxon';
import { ShareContactType } from '../../graphql/generated/types';
import { AppErrorPanel } from '../../ui/AppErrorPanel';
import { FormInput } from '../../ui/FormInput';
import { MultiCombobox, type MultiComboboxOption } from '../../ui/MultiCombobox';
import { Button, HStack, VStack } from '../../ui/Primitives';
import { ShareTokenResult } from './ShareTokenResult';
import { enumItemsFromValueDisplay } from './shareGrantOptionMapping';

export type GrantSharePublicLinkFormValues = {
  operations: Operation[];
  label?: string;
  expiresAt?: DateTime;
};

export type GrantShareUserFormValues = GrantSharePublicLinkFormValues & {
  grantedToHandles: string[];
};

type GrantShareFormProps = {
  suggestions: ShareContactType[];
  operationOptions: readonly MultiComboboxOption[];
  onSubmit: (input: GrantShareUserFormValues) => Promise<void>;
  /** When set, shows a "Create shareable link" path that does not require a handle. */
  onCreatePublicLink?: (input: GrantSharePublicLinkFormValues) => Promise<void>;
  isLoading: boolean;
  errors: AppError[];
  createdToken?: string;
  onClose: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimmedOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeRecipientInput = (input: string): string => input.trim().toLowerCase();

const findExistingRecipientOption = (
  input: string,
  options: readonly MultiComboboxOption[],
): MultiComboboxOption | undefined => {
  const normalized = normalizeRecipientInput(input);
  return options.find((option) => normalizeRecipientInput(option.display) === normalized);
};

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

const recipientsRequiredMessage = (hasPublicLinkPath: boolean): string =>
  hasPublicLinkPath
    ? 'Add at least one recipient to share with specific people, or use “Create shareable link” below.'
    : 'Add at least one recipient to share with specific people.';

const contactsToRecipientOptions = (contacts: ShareContactType[]): MultiComboboxOption[] =>
  contacts.map((contact) => ({
    value: normalizeRecipientInput(contact.handle),
    display: normalizeRecipientInput(contact.handle),
  }));

export const GrantShareForm = ({
  suggestions,
  operationOptions,
  onSubmit,
  onCreatePublicLink,
  isLoading,
  errors,
  createdToken,
  onClose,
}: GrantShareFormProps) => {
  const [recipients, setRecipients] = useState<MultiComboboxOption[]>([]);
  const [operations, setOperations] = useState<MultiComboboxOption[]>(() => [...operationOptions]);
  const [label, setLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState<DateTime | undefined>();
  const [recipientsError, setRecipientsError] = useState<string | undefined>(undefined);

  const recipientOptions = useMemo(() => contactsToRecipientOptions(suggestions), [suggestions]);

  const setRecipientsValue = (value: MultiComboboxOption[]) => {
    setRecipients(value);
    if (recipientsError) {
      setRecipientsError(undefined);
    }
  };

  const validateRecipientEntry = useCallback(
    (input: string): string | undefined => {
      if (findExistingRecipientOption(input, recipientOptions)) {
        return undefined;
      }
      return validateEmail(input);
    },
    [recipientOptions],
  );

  const createRecipientItem = useCallback(
    (input: string): MultiComboboxOption => {
      const existing = findExistingRecipientOption(input, recipientOptions);
      if (existing) {
        return existing;
      }
      const normalized = normalizeRecipientInput(input);
      return { value: normalized, display: normalized };
    },
    [recipientOptions],
  );

  const sharedFormValues = (): GrantSharePublicLinkFormValues => ({
    operations: enumItemsFromValueDisplay(Operation, operations),
    label: trimmedOrUndefined(label),
    expiresAt,
  });

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    if (recipients.length === 0) {
      setRecipientsError(recipientsRequiredMessage(Boolean(onCreatePublicLink)));
      return;
    }
    setRecipientsError(undefined);
    await onSubmit({
      grantedToHandles: recipients.map((recipient) => recipient.value),
      ...sharedFormValues(),
    });
  };

  const handleCreateShareableLink = async () => {
    if (isLoading) {
      return;
    }
    setRecipientsError(undefined);
    await onCreatePublicLink?.(sharedFormValues());
  };

  if (createdToken) {
    return (
      <VStack gap={3}>
        <AppErrorPanel errors={errors} />
        <ShareTokenResult token={createdToken} />
        <Actions>
          <Button type="button" variant="primary" onClick={onClose}>
            Done
          </Button>
        </Actions>
      </VStack>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <VStack gap={3}>
        <AppErrorPanel errors={errors} />
        <MultiCombobox
          label="Recipients"
          value={recipients}
          onChange={setRecipientsValue}
          items={recipientOptions}
          allowCustomValue
          validateEntry={validateRecipientEntry}
          createCustomItem={createRecipientItem}
          placeholder="user@example.com or @handle"
          disabled={isLoading}
          error={recipientsError}
        />
        <MultiCombobox
          label="Additional Permissions"
          hint="Anyone you share with can always view."
          value={operations}
          onChange={setOperations}
          items={operationOptions}
          allowCustomValue={false}
          disabled={isLoading}
        />
        <FormInput
          label="Label (optional)"
          placeholder="e.g. Family album"
          value={label}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setLabel(event.target.value)}
          disabled={isLoading}
        />
        <FormInput
          type="date"
          label="Expires (optional)"
          value={expiresAt?.toISO() ?? ''}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setExpiresAt(DateTime.fromISO(event.target.value))
          }
          disabled={isLoading}
        />
        {onCreatePublicLink && (
          <ShareableLinkBlock>
            <LinkDisclaimer>
              Anyone with the link can use the access level you select above. Do not share the link
              with people you do not trust. Access lasts until the share expires or you revoke it.
            </LinkDisclaimer>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCreateShareableLink}
              disabled={isLoading}
            >
              {isLoading ? 'Please wait\u2026' : 'Create shareable link'}
            </Button>
          </ShareableLinkBlock>
        )}
        <Actions>
          <HStack gap={2}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Please wait\u2026' : 'Share with user'}
            </Button>
          </HStack>
        </Actions>
      </VStack>
    </Form>
  );
};

const Form = styled.form`
  width: 100%;
`;

const ShareableLinkBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  border-top: 1px solid ${({ theme }) => theme.color.border};
`;

const LinkDisclaimer = styled.p`
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing(1)};
`;
