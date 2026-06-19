import React, { useState } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../domain/errors/errorTypes';

import { Operation } from '@packages/contracts';
import { DateTime } from 'luxon';
import { ShareContactType } from '../../graphql/generated/types';
import { AppErrorPanel } from '../../ui/AppErrorPanel';
import { FormInput } from '../../ui/FormInput';
import { Button, HStack, VStack } from '../../ui/Primitives';
import { ShareRecipientInput } from './ShareRecipientInput';
import { ShareTokenResult } from './ShareTokenResult';

export type GrantSharePublicLinkFormValues = {
  operations: Operation[];
  label?: string;
  expiresAt?: DateTime;
};

export type GrantShareUserFormValues = GrantSharePublicLinkFormValues & {
  handle: string;
};

type GrantShareFormProps = {
  suggestions: ShareContactType[];
  onSubmit: (input: GrantShareUserFormValues) => Promise<void>;
  /** When set, shows a "Create shareable link" path that does not require a handle. */
  onCreatePublicLink?: (input: GrantSharePublicLinkFormValues) => Promise<void>;
  isLoading: boolean;
  errors: AppError[];
  createdToken?: string;
  onClose: () => void;
};

const trimmedOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const handleRequiredMessage = (hasPublicLinkPath: boolean): string =>
  hasPublicLinkPath
    ? 'Enter a user handle to share with a specific person, or use “Create shareable link” below.'
    : 'Enter a user handle to share with a specific person.';

export const GrantShareForm = ({
  suggestions,
  onSubmit,
  onCreatePublicLink,
  isLoading,
  errors,
  createdToken,
  onClose,
}: GrantShareFormProps) => {
  const [handle, setHandle] = useState('');
  const [operations] = useState<Operation[]>([]);
  const [label, setLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState<DateTime | undefined>();
  const [handleError, setHandleError] = useState<string | undefined>(undefined);

  const setHandleValue = (value: string) => {
    setHandle(value);
    if (handleError) {
      setHandleError(undefined);
    }
  };

  const sharedFormValues = (): GrantSharePublicLinkFormValues => ({
    operations,
    label: trimmedOrUndefined(label),
    expiresAt,
  });

  const handleSubmit = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }
    const trimmedHandle = handle.trim();
    if (!trimmedHandle) {
      setHandleError(handleRequiredMessage(Boolean(onCreatePublicLink)));
      return;
    }
    setHandleError(undefined);
    await onSubmit({
      handle: trimmedHandle,
      ...sharedFormValues(),
    });
  };

  const handleCreateShareableLink = async () => {
    if (isLoading) {
      return;
    }
    setHandleError(undefined);
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
        <ShareRecipientInput
          value={handle}
          onChange={setHandleValue}
          suggestions={suggestions}
          disabled={isLoading}
          error={handleError}
        />
        {/* <SharePermissionSelect value={operations} onChange={setPermission} disabled={isLoading} /> */}
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
