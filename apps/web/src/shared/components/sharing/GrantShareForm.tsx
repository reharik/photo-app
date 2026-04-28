import React, { useState } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../../application/errors/types';
import type {
  ShareContactSuggestion,
  SharePermissionValue,
} from '../../../application/sharing/useGrantShare';
import { FormInput } from '../../../ui/FormInput';
import { Button, HStack, VStack } from '../../../ui/Primitives';
import { AppErrorPanel } from '../ui/AppErrorPanel';
import { SharePermissionSelect } from './SharePermissionSelect';
import { ShareRecipientInput } from './ShareRecipientInput';
import { ShareTokenResult } from './ShareTokenResult';

export type GrantShareFormValues = {
  handle: string;
  permission: SharePermissionValue;
  label?: string;
  expiresAt?: string;
};

type GrantShareFormProps = {
  suggestions: ShareContactSuggestion[];
  onSubmit: (input: GrantShareFormValues) => Promise<void>;
  /** When set, shows a "Create shareable link" path and requires a handle for the primary Share action. */
  onCreateShareableLink?: (input: GrantShareFormValues) => Promise<void>;
  isLoading: boolean;
  errors: AppError[];
  createdToken?: string;
  onClose: () => void;
};

const trimmedOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const GrantShareForm = ({
  suggestions,
  onSubmit,
  onCreateShareableLink,
  isLoading,
  errors,
  createdToken,
  onClose,
}: GrantShareFormProps) => {
  const [handle, setHandle] = useState('');
  const [permission, setPermission] = useState<SharePermissionValue>('view');
  const [label, setLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shareToUserError, setShareToUserError] = useState<string | undefined>(undefined);

  const setHandleValue = (value: string) => {
    setHandle(value);
    if (shareToUserError) {
      setShareToUserError(undefined);
    }
  };

  const handleSelectSuggestion = (suggestion: ShareContactSuggestion) => {
    setHandleValue(suggestion.handle);
  };

  const formValues = (): GrantShareFormValues => ({
    handle: handle.trim(),
    permission,
    label: trimmedOrUndefined(label),
    expiresAt: trimmedOrUndefined(expiresAt),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    if (onCreateShareableLink && !handle.trim()) {
      setShareToUserError(
        'Enter a user handle to share with a specific person, or use “Create shareable link” below.',
      );
      return;
    }
    setShareToUserError(undefined);
    await onSubmit(formValues());
  };

  const handleCreateShareableLink = async () => {
    if (isLoading) {
      return;
    }
    setShareToUserError(undefined);
    await onCreateShareableLink?.(formValues());
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
        {shareToUserError && <FieldHint role="alert">{shareToUserError}</FieldHint>}
        <ShareRecipientInput
          value={handle}
          onChange={setHandleValue}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          disabled={isLoading}
        />
        <SharePermissionSelect value={permission} onChange={setPermission} disabled={isLoading} />
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
          value={expiresAt}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setExpiresAt(event.target.value)
          }
          disabled={isLoading}
        />
        {onCreateShareableLink && (
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

const FieldHint = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.danger};
`;

const ShareableLinkBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const LinkDisclaimer = styled.p`
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.subtext};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing(1)};
`;
