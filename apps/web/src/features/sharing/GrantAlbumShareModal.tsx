import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';

import {
  GrantUserAuthorizationForAlbumDocument,
  GrantUserAuthorizationForAlbumInput,
  GrantUserAuthorizationForAlbumMutation,
  ShareContactType,
  ViewerShareContactsDocument,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { AppModal } from '../../ui/AppModal';
import { GrantShareForm, type GrantShareFormValues } from './GrantShareForm';

type GrantAlbumShareModalProps = {
  albumId: string;
  onSuccessToast?: (message: string) => void;
  onErrorToast?: (message: string) => void;
  onClose: () => void;
};

const toIsoExpiry = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

export const GrantAlbumShareModal = ({
  albumId,
  onSuccessToast,
  onErrorToast,
  onClose,
}: GrantAlbumShareModalProps) => {
  const { isLoading, errors, execute: grantUserAuthorization } = useAppMutationState();

  const [createdToken, setCreatedToken] = useState<string | undefined>(undefined);

  const contactsQuery = useQuery(ViewerShareContactsDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const suggestions: ShareContactType[] = useMemo(
    () => contactsQuery.data?.viewer?.shareContacts ?? [],
    [contactsQuery.data],
  );

  const handleSubmit = async (values: GrantShareFormValues): Promise<void> => {
    const input: GrantUserAuthorizationForAlbumInput = {
      albumId,
      permission: values.permission,
      grantedToHandle: values.handle.length > 0 ? values.handle : undefined,
      label: values.label,
      expiresAt: toIsoExpiry(values.expiresAt),
    };

    const result = await grantUserAuthorization(
      {
        mutation: GrantUserAuthorizationForAlbumDocument,
        variables: {
          input,
        },
      },
      (data: GrantUserAuthorizationForAlbumMutation) => data.grantUserAuthorizationForAlbum,
    );

    if (result.success && result.data?.token) {
      setCreatedToken(result.data.token);
      return;
    }
    if (!result.success) {
      onErrorToast?.(result.errors[0]?.message ?? "Couldn't share album");
      onClose();
      return;
    }

    onSuccessToast?.('Shared album with user');
    onClose();
  };

  const handleCreateShareableLink = async (values: GrantShareFormValues): Promise<void> => {
    const input: GrantAlbumShareInput = {
      albumId,
      permission: values.permission,
      label: values.label,
      expiresAt: toIsoExpiry(values.expiresAt),
    };
    const result = await grantAlbumShare(input);
    if (!result.success) {
      return;
    }
    if (result.data?.token) {
      setCreatedToken(result.data.token);
    }
  };

  return (
    <AppModal onClose={onClose} title="Share album" closeOnBackdropClick={!isLoading}>
      <GrantShareForm
        suggestions={suggestions}
        onSubmit={handleSubmit}
        onCreateShareableLink={handleCreateShareableLink}
        isLoading={isLoading}
        errors={errors}
        createdToken={createdToken}
        onClose={onClose}
      />
    </AppModal>
  );
};
