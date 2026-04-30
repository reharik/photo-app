import {
  AuthorizationType,
  GrantUserAuthorizationForAlbumDocument,
  type GrantUserAuthorizationForAlbumInput,
  type GrantUserAuthorizationForAlbumMutation,
  GrantUserAuthorizationResult,
  type ViewerShareContactsQuery,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../shared/components/dataAccess/useAppMutation';
import { type AppError, type AppResult, type MutationPayload } from '../errors/types';

export type ShareContactSuggestion = NonNullable<
  ViewerShareContactsQuery['viewer']
>['shareContacts'][number];

export type SharePermissionValue = 'view' | 'comment' | 'download';

// export type GrantShareData = {
//   token?: string;
//   share?: ShareSummary;
// };

export type GrantUserAuthorizationsForMediaItemsInputData = {
  authorizations: AuthorizationType[];
};

const toMutationPayload = (
  payload: GrantUserAuthorizationResult,
): MutationPayload<AuthorizationType[]> => ({
  data: !payload.errors ? { authorizations: payload.share } : null,
  errors: payload.errors ?? [],
});

const toManyMutationPayload = (
  payload: GrantUserAuthorizationResult,
): MutationPayload<GrantUserAuthorizationsForMediaItemsInputData> => ({
  data: !payload.errors ? { authorizations: payload.authorizations ?? [] } : null,
  errors: payload.errors ?? [],
});

export type UseGrantShareResult = {
  grantMediaItemShare: (input: GrantMediaItemShareInput) => Promise<AppResult<GrantShareData>>;
  grantUserAuthorizationsForMediaItemsInput: (
    input: GrantUserAuthorizationsForMediaItemsInputInput,
  ) => Promise<AppResult<GrantUserAuthorizationsForMediaItemsInputData>>;
  grantUserAuthorizationForAlbum: (
    input: GrantUserAuthorizationForAlbumInput,
  ) => Promise<AppResult<GrantShareData>>;
  isLoading: boolean;
  errors: AppError[];
};

export const useGrantShare = (): UseGrantShareResult => {
  const { isLoading, errors, execute } = useAppMutationState();

  const grantMediaItemShare = (
    input: GrantMediaItemShareInput,
  ): Promise<AppResult<GrantShareData>> =>
    execute(
      { mutation: GrantMediaItemShareDocument, variables: { input } },
      (data: GrantMediaItemShareMutation) => toMutationPayload(data.grantMediaItemShare),
    );

  const grantUserAuthorizationsForMediaItemsInput = (
    input: GrantUserAuthorizationsForMediaItemsInputInput,
  ): Promise<AppResult<GrantUserAuthorizationsForMediaItemsInputData>> =>
    execute(
      { mutation: GrantUserAuthorizationsForMediaItemsInputDocument, variables: { input } },
      (data: GrantUserAuthorizationsForMediaItemsInputMutation) =>
        toManyMutationPayload(data.grantUserAuthorizationsForMediaItemsInput),
    );

  const grantUserAuthorizationForAlbum = (
    input: GrantUserAuthorizationForAlbumInput,
  ): Promise<AppResult<GrantShareData>> =>
    execute(
      { mutation: GrantUserAuthorizationForAlbumDocument, variables: { input } },
      (data: GrantUserAuthorizationForAlbumMutation) =>
        toMutationPayload(data.grantUserAuthorizationForAlbum),
    );

  return {
    grantMediaItemShare,
    grantUserAuthorizationsForMediaItemsInput,
    grantUserAuthorizationForAlbum,
    isLoading,
    errors,
  };
};
