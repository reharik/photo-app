import { useQuery } from '@apollo/client/react';
import { JSX } from 'react';
import styled from 'styled-components';
import { CommentsForPublicMediaItemDocument } from '../../graphql/generated/types';
import { getQueryRenderState } from '../../hooks/getQueryRenderState';
import { CommentsPanel } from '../comments/CommentsPanel';

const PAGE_SIZE = 50;

export type PublicCommentsForMediaItemContainerProps = {
  mediaItemId: string;
};

export const PublicCommentsForMediaItemContainer = ({
  mediaItemId,
}: PublicCommentsForMediaItemContainerProps): JSX.Element => {
  const query = useQuery(CommentsForPublicMediaItemDocument, {
    variables: { mediaItemId, limit: PAGE_SIZE, offset: 0 },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    context: { accessMode: 'public' },
  });

  const { data, content } = getQueryRenderState({
    query,
    select: (data) => data.publicAccess?.mediaItem?.comments,
  });
  const comments = data?.nodes ?? [];
  const titleText = data && data.totalCount > 0 ? `Comments · ${data.totalCount}` : 'Comments';
  if (!comments) {
    return <>{content}</>;
  }
  return (
    <Root>
      <SectionTitle>{titleText}</SectionTitle>
      <CommentsPanel
        comments={comments}
        loading={query.loading}
        error={[]}
        canComment={false}
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

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
