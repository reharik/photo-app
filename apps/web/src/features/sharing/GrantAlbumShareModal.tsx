import { useQuery } from '@apollo/client/react';
import { useMemo } from 'react';

import {
  GrantUserAuthorizationForAlbumDocument,
  GrantUserAuthorizationForAlbumInput,
  GrantUserAuthorizationForAlbumMutation,
  ShareContactType,
  type SharePermission,
  ViewerShareContactsDocument,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../hooks/useAppMutation';
import { AppModal } from '../../ui/AppModal';
import { GrantShareForm, type GrantShareFormValues } from './GrantShareForm';

type GrantAlbumShareModalProps = {
  albumId: string;
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

export const GrantAlbumShareModal = ({ albumId, onClose }: GrantAlbumShareModalProps) => {
  const { isLoading, errors, execute: grantUserAuthorization } = useAppMutationState();

  // const [createdToken, setCreatedToken] = useState<string | undefined>(undefined);

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
      permission: PERMISSION_BY_VALUE[values.permission],
      grantedToHandle: values.handle.length > 0 ? values.handle : undefined,
      label: values.label,
      expiresAt: toIsoExpiry(values.expiresAt),
    };

    void (await grantUserAuthorization(
      {
        mutation: GrantUserAuthorizationForAlbumDocument,
        variables: {
          input,
        },
      },
      (data: GrantUserAuthorizationForAlbumMutation) => data.grantUserAuthorizationForAlbum,
    ));

    // if (result.data?.token) {
    //   setCreatedToken(result.data.token);
    //   return;
    // }
    onClose();
  };

  // const handleCreateShareableLink = async (values: GrantShareFormValues): Promise<void> => {
  //   const input: GrantAlbumShareInput = {
  //     albumId,
  //     permission: PERMISSION_BY_VALUE[values.permission],
  //     label: values.label,
  //     expiresAt: toIsoExpiry(values.expiresAt),
  //   };
  //   const result = await grantAlbumShare(input);
  //   if (!result.success) {
  //     return;
  //   }
  //   if (result.data?.token) {
  //     setCreatedToken(result.data.token);
  //   }
  // };

  return (
    <AppModal onClose={onClose} title="Share album" closeOnBackdropClick={!isLoading}>
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
