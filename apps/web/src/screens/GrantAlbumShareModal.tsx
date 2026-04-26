import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import {
  type ShareContactSuggestion,
  type SharePermissionValue,
  useGrantShare,
} from '../application/sharing/useGrantShare';
import {
  type GrantAlbumShareInput,
  ShareContactsDocument,
  type SharePermission,
} from '../graphql/generated/types';
import {
  GrantShareForm,
  type GrantShareFormValues,
} from '../shared/components/sharing/GrantShareForm';
import { AppModal } from '../shared/components/ui/AppModal';

type GrantAlbumShareModalProps = {
  albumId: string;
  onClose: () => void;
};

const PERMISSION_BY_VALUE: Record<SharePermissionValue, SharePermission> = {
  view: 'VIEW',
  comment: 'COMMENT',
  download: 'DOWNLOAD',
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

export const GrantAlbumShareModal = ({ albumId, onClose }: GrantAlbumShareModalProps) => {
  const [createdToken, setCreatedToken] = useState<string | undefined>(undefined);

  const contactsQuery = useQuery(ShareContactsDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { grantAlbumShare, isLoading, errors } = useGrantShare();

  const suggestions: ShareContactSuggestion[] = useMemo(
    () => contactsQuery.data?.shareContacts ?? [],
    [contactsQuery.data],
  );

  const handleSubmit = async (values: GrantShareFormValues): Promise<void> => {
    const input: GrantAlbumShareInput = {
      albumId,
      permission: PERMISSION_BY_VALUE[values.permission],
      grantedToHandle: values.handle.length > 0 ? values.handle : undefined,
      label: values.label,
      expiresAt: toIsoExpiry(values.expiresAt),
    };
    const result = await grantAlbumShare(input);
    if (result.success && result.data.token) {
      setCreatedToken(result.data.token);
    }
  };

  return (
    <AppModal onClose={onClose} title="Share album" closeOnBackdropClick={!isLoading}>
      <GrantShareForm
        suggestions={suggestions}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        errors={errors}
        createdToken={createdToken}
        onClose={onClose}
      />
    </AppModal>
  );
};
