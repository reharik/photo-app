import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';
import {
  GrantUserAuthorizationsForMediaItemsDocument,
  GrantUserAuthorizationsForMediaItemsInput,
  GrantUserAuthorizationsForMediaItemsMutation,
  ShareContactType,
  type SharePermission,
  ViewerShareContactsDocument,
} from '../graphql/generated/types';
import { useAppMutationState } from '../shared/components/dataAccess/useAppMutation';
import {
  GrantShareForm,
  type GrantShareFormValues,
} from '../shared/components/sharing/GrantShareForm';
import { AppModal } from '../shared/components/ui/AppModal';

type GrantMediaItemShareModalProps = {
  mediaItemIds: string[];
  onClose: () => void;
};

const PERMISSION_BY_VALUE: Record<string, SharePermission> = {
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
  const { isLoading, errors, execute: grantUserAuthorization } = useAppMutationState();

  const contactsQuery = useQuery(ViewerShareContactsDocument, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const suggestions: ShareContactType[] = useMemo(
    () => contactsQuery.data?.viewer?.shareContacts ?? [],
    [contactsQuery.data],
  );

  const handleSubmit = async (values: GrantShareFormValues): Promise<void> => {
    if (mediaItemIds.length === 0) {
      return;
    }

    const grantedToHandle = values.handle.length > 0 ? values.handle : undefined;
    const expiresAt = toIsoExpiry(values.expiresAt);
    const permission = PERMISSION_BY_VALUE[values.permission];

    const input: GrantUserAuthorizationsForMediaItemsInput = {
      mediaItemIds,
      permission,
      grantedToHandle,
      label: values.label,
      expiresAt,
    };
    void (await grantUserAuthorization(
      {
        mutation: GrantUserAuthorizationsForMediaItemsDocument,
        variables: {
          input,
        },
      },
      (data: GrantUserAuthorizationsForMediaItemsMutation) =>
        data.grantUserAuthorizationsForMediaItems,
    ));

    // if (result.data.token) {
    //   setCreatedToken(result.data.token);
    //   return;
    // }

    onClose();
  };

  /*   const handleCreateShareableLink = async (values: GrantShareFormValues): Promise<void> => {
    if (mediaItemIds.length === 0) {
      return;
    }
    const permission = PERMISSION_BY_VALUE[values.permission];
    const input: GrantManyMediaItemSharesInput = {
      mediaItemIds,
      permission,
      label: values.label,
      expiresAt: toIsoExpiry(values.expiresAt),
    };
    const result = await grantManyMediaItemShares(input);
    if (!result.success) {
      return;
    }
    if (result.data?.token) {
      setCreatedToken(result.data.token);
    }
  }; */

  return (
    <AppModal
      onClose={onClose}
      title={buildTitle(mediaItemIds.length)}
      closeOnBackdropClick={!isLoading}
    >
      <GrantShareForm
        suggestions={suggestions}
        onSubmit={handleSubmit}
        // onCreateShareableLink={handleCreateShareableLink}
        isLoading={isLoading}
        errors={errors}
        // createdToken={createdToken}
        onClose={onClose}
      />
    </AppModal>
  );
};
