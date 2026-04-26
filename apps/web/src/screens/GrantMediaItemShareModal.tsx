import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import {
  type ShareContactSuggestion,
  type SharePermissionValue,
  useGrantShare,
} from '../application/sharing/useGrantShare';
import {
  type GrantManyMediaItemSharesInput,
  ShareContactsDocument,
  type SharePermission,
} from '../graphql/generated/types';
import {
  GrantShareForm,
  type GrantShareFormValues,
} from '../shared/components/sharing/GrantShareForm';
import { AppModal } from '../shared/components/ui/AppModal';

type GrantMediaItemShareModalProps = {
  mediaItemIds: string[];
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

const buildTitle = (count: number): string =>
  count === 1 ? 'Share photo' : `Share ${count} photos`;

export const GrantMediaItemShareModal = ({
  mediaItemIds,
  onClose,
}: GrantMediaItemShareModalProps) => {
  const [createdToken, setCreatedToken] = useState<string | undefined>(undefined);

  const contactsQuery = useQuery(ShareContactsDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { grantManyMediaItemShares, isLoading, errors } = useGrantShare();

  const suggestions: ShareContactSuggestion[] = useMemo(
    () => contactsQuery.data?.shareContacts ?? [],
    [contactsQuery.data],
  );

  const handleSubmit = async (values: GrantShareFormValues): Promise<void> => {
    if (mediaItemIds.length === 0) {
      return;
    }

    const grantedToHandle = values.handle.length > 0 ? values.handle : undefined;
    const expiresAt = toIsoExpiry(values.expiresAt);
    const permission = PERMISSION_BY_VALUE[values.permission];

    const input: GrantManyMediaItemSharesInput = {
      mediaItemIds,
      permission,
      grantedToHandle,
      label: values.label,
      expiresAt,
    };

    const result = await grantManyMediaItemShares(input);

    if (!result.success) {
      return;
    }

    if (result.data.token) {
      setCreatedToken(result.data.token);
      return;
    }

    onClose();
  };

  return (
    <AppModal
      onClose={onClose}
      title={buildTitle(mediaItemIds.length)}
      closeOnBackdropClick={!isLoading}
    >
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
