import {
  GrantAlbumShareDocument,
  type GrantAlbumShareInput,
  type GrantAlbumShareMutation,
  GrantManyMediaItemSharesDocument,
  type GrantManyMediaItemSharesInput,
  type GrantManyMediaItemSharesMutation,
  GrantMediaItemShareDocument,
  type GrantMediaItemShareInput,
  type GrantMediaItemShareMutation,
  type ViewerShareContactsQuery,
} from '../../graphql/generated/types';
import { useAppMutationState } from '../../shared/components/dataAccess/useAppMutation';
import { type AppError, type AppResult, type MutationPayload } from '../errors/types';

export type ShareContactSuggestion = NonNullable<
  ViewerShareContactsQuery['viewer']
>['shareContacts'][number];

export type SharePermissionValue = 'view' | 'comment' | 'download';

type GrantSharePayload = GrantMediaItemShareMutation['grantMediaItemShare'];

export type ShareSummary = NonNullable<GrantSharePayload['share']>;

export type GrantShareData = {
  token?: string;
  share?: ShareSummary;
};

export type GrantManyMediaItemSharesData = {
  token?: string;
  shares: ShareSummary[];
};

const toMutationPayload = (payload: GrantSharePayload): MutationPayload<GrantShareData> => ({
  data: payload.success ? { token: payload.token, share: payload.share } : null,
  errors: payload.errors ?? [],
});

const toManyMutationPayload = (
  payload: GrantManyMediaItemSharesMutation['grantManyMediaItemShares'],
): MutationPayload<GrantManyMediaItemSharesData> => ({
  data: payload.success ? { token: payload.token, shares: payload.shares ?? [] } : null,
  errors: payload.errors ?? [],
});

export type UseGrantShareResult = {
  grantMediaItemShare: (input: GrantMediaItemShareInput) => Promise<AppResult<GrantShareData>>;
  grantManyMediaItemShares: (
    input: GrantManyMediaItemSharesInput,
  ) => Promise<AppResult<GrantManyMediaItemSharesData>>;
  grantAlbumShare: (input: GrantAlbumShareInput) => Promise<AppResult<GrantShareData>>;
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

  const grantManyMediaItemShares = (
    input: GrantManyMediaItemSharesInput,
  ): Promise<AppResult<GrantManyMediaItemSharesData>> =>
    execute(
      { mutation: GrantManyMediaItemSharesDocument, variables: { input } },
      (data: GrantManyMediaItemSharesMutation) =>
        toManyMutationPayload(data.grantManyMediaItemShares),
    );

  const grantAlbumShare = (input: GrantAlbumShareInput): Promise<AppResult<GrantShareData>> =>
    execute(
      { mutation: GrantAlbumShareDocument, variables: { input } },
      (data: GrantAlbumShareMutation) => toMutationPayload(data.grantAlbumShare),
    );

  return {
    grantMediaItemShare,
    grantManyMediaItemShares,
    grantAlbumShare,
    isLoading,
    errors,
  };
};
