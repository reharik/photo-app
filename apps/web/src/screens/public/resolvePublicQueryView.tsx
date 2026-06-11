import type { ReactNode } from 'react';
import { BrandedLoading } from './BrandedLoading';
import { PublicUnavailable } from './PublicUnavailable';

type PublicQueryLike = {
  loading: boolean;
  error?: unknown;
  data?: unknown;
};

type ResolvePublicQueryViewArgs = {
  query: PublicQueryLike;
  content: ReactNode | undefined;
  isUnavailable?: boolean;
};

export const resolvePublicQueryView = ({
  query,
  content,
  isUnavailable = false,
}: ResolvePublicQueryViewArgs): ReactNode => {
  if (query.loading && !query.data) {
    return <BrandedLoading />;
  }

  if (query.error != null || isUnavailable) {
    return <PublicUnavailable />;
  }

  if (content != null) {
    return content;
  }

  return <PublicUnavailable />;
};
