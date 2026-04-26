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
  isLoading,
  errors,
  createdToken,
  onClose,
}: GrantShareFormProps) => {
  const [handle, setHandle] = useState('');
  const [permission, setPermission] = useState<SharePermissionValue>('view');
  const [label, setLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleSelectSuggestion = (suggestion: ShareContactSuggestion) => {
    setHandle(suggestion.handle);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    await onSubmit({
      handle: handle.trim(),
      permission,
      label: trimmedOrUndefined(label),
      expiresAt: trimmedOrUndefined(expiresAt),
    });
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
        <ShareRecipientInput
          value={handle}
          onChange={setHandle}
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
        <Actions>
          <HStack gap={2}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? 'Sharing\u2026' : 'Share'}
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

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing(1)};
`;
