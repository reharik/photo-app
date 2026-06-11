import { useQuery } from '@apollo/client/react';
import { JSX } from 'react';
import styled from 'styled-components';
import { CommentsForPublicMediaItemDocument } from '../../graphql/generated/types';
import { getQueryRenderState } from '../../hooks/getQueryRenderState';
import { CommentsPanel, type CommentsPanelLayout } from '../comments/CommentsPanel';

const PAGE_SIZE = 50;

export type PublicCommentsForMediaItemContainerProps = {
  mediaItemId: string;
  layout?: CommentsPanelLayout;
};

export const PublicCommentsForMediaItemContainer = ({
  mediaItemId,
  layout = 'default',
}: PublicCommentsForMediaItemContainerProps): JSX.Element | null => {
  const query = useQuery(CommentsForPublicMediaItemDocument, {
    variables: { mediaItemId, limit: PAGE_SIZE, offset: 0 },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    context: { accessMode: 'public' },
  });

  const { data } = getQueryRenderState({
    query,
    select: (data) => data.publicAccess?.mediaItem?.comments,
  });
  const comments = data?.nodes ?? [];

  if (query.error != null) {
    return null;
  }

  if (!comments) {
    return null;
  }
  return (
    <Root>
      <CommentsPanel
        comments={comments}
        loading={query.loading}
        error={[]}
        canComment={false}
        layout={layout}
        onRetry={() => void query.refetch()}
      />
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;
