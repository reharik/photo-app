import { useApolloClient } from '@apollo/client/react';
import { useCallback } from 'react';

import {
  DeleteShareContactDocument,
  type DeleteShareContactMutation,
  ViewerShareContactsDocument,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../hooks/useAppMutation';

export type UseDeleteShareContactResult = {
  deleteContact: (handle: string) => Promise<void>;
};

/**
 * Deletes a saved share contact by handle (scoped to the viewer server-side) and, on
 * success, evicts it from the cached `viewer.shareContacts` list so the suggestion
 * disappears immediately — no refetch round-trip. Removal is case-insensitive to stay
 * robust against handle-casing drift between the option value and the stored row.
 */
export const useDeleteShareContact = (
  onError?: (message: string) => void,
): UseDeleteShareContactResult => {
  const client = useApolloClient();
  const { execute } = useAppMutationState();

  const deleteContact = useCallback(
    async (handle: string): Promise<void> => {
      const result = await execute(
        {
          mutation: DeleteShareContactDocument,
          variables: { handle },
        },
        (data: DeleteShareContactMutation) => data.deleteShareContact,
      );

      if (!result.success) {
        onError?.(result.errors[0]?.message ?? "Couldn't remove saved contact");
        return;
      }

      const deletedHandle = (result.data?.handle ?? handle).toLowerCase();
      client.cache.updateQuery({ query: ViewerShareContactsDocument }, (existing) => {
        const viewer = existing?.viewer;
        if (!viewer) {
          return existing;
        }
        return {
          ...existing,
          viewer: {
            ...viewer,
            shareContacts: viewer.shareContacts.filter(
              (contact) => contact.handle.toLowerCase() !== deletedHandle,
            ),
          },
        };
      });
    },
    [client, execute, onError],
  );

  return { deleteContact };
};
