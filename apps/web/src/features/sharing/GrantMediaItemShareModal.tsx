import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import {
  CreatePublicLinkForMediaItemsDocument,
  CreatePublicLinkForMediaItemsInput,
  CreatePublicLinkForMediaItemsMutation,
  GrantUserAuthorizationsForMediaItemsDocument,
  GrantUserAuthorizationsForMediaItemsInput,
  GrantUserAuthorizationsForMediaItemsMutation,
  Operation,
  ShareContactType,
  ViewerShareContactsDocument,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { AppModal } from '../../ui/AppModal';
import { GrantShareForm, type GrantShareFormValues } from './GrantShareForm';

type GrantMediaItemShareModalProps = {
  mediaItemIds: string[];
  onSuccessToast?: (message: string) => void;
  onErrorToast?: (message: string) => void;
  onClose: () => void;
};

const buildTitle = (count: number): string =>
  count === 1 ? 'Share photo' : `Share ${count} photos`;

export const GrantMediaItemShareModal = ({
  mediaItemIds,
  onSuccessToast,
  onErrorToast,
  onClose,
}: GrantMediaItemShareModalProps) => {
  const [createdToken, setCreatedToken] = useState<string | undefined>(undefined);

  const { isLoading, errors, execute: grantUserAuthorization } = useAppMutationState();
  const {
    // publicLinkIsLoading,
    // publicLinkErrors,
    execute: createPublicLinkForMediaItems,
  } = useAppMutationState();

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
    // const operations = values.operations;
    const input: GrantUserAuthorizationsForMediaItemsInput = {
      mediaItemIds,
      operations: [Operation.download, Operation.comment],
      grantedToHandle,
      label: values.label,
      expiresAt: values.expiresAt,
    };
    const result = await grantUserAuthorization(
      {
        mutation: GrantUserAuthorizationsForMediaItemsDocument,
        variables: {
          input,
        },
      },
      (data: GrantUserAuthorizationsForMediaItemsMutation) =>
        data.grantUserAuthorizationsForMediaItems,
    );

    // if (result.data.token) {
    //   setCreatedToken(result.data.token);
    //   return;
    // }

    if (!result.success) {
      onErrorToast?.(result.errors[0]?.message ?? "Couldn't share items");
      onClose();
      return;
    }

    onSuccessToast?.(
      mediaItemIds.length === 1 ? 'Shared 1 item with user' : `Shared ${mediaItemIds.length} items`,
    );
    onClose();
  };

  const handleCreatePublicLink = async (values: GrantShareFormValues): Promise<void> => {
    if (mediaItemIds.length === 0) {
      return;
    }
    const input: CreatePublicLinkForMediaItemsInput = {
      mediaItemIds,
      name: values.label,
      expiresAt: values.expiresAt,
    };
    const result = await createPublicLinkForMediaItems(
      {
        mutation: CreatePublicLinkForMediaItemsDocument,
        variables: {
          input,
        },
      },
      (data: CreatePublicLinkForMediaItemsMutation) => data.createPublicLinkForMediaItems,
    );

    if (!result.success) {
      return;
    }
    if (result.data?.token) {
      setCreatedToken(result.data.token);
    }
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
        onCreatePublicLink={handleCreatePublicLink}
        isLoading={isLoading}
        errors={errors}
        createdToken={createdToken}
        onClose={onClose}
      />
    </AppModal>
  );
};
