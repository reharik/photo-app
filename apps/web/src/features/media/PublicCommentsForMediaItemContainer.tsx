import { useQuery } from '@apollo/client/react';
import { JSX, useMemo } from 'react';
import styled from 'styled-components';
import { CommentsForPublicMediaItemDocument } from '../../graphql/generated/types';
import { CommentsPanel } from '../comments/CommentsPanel';
import {
  countVisiblePanelComments,
  groupCommentDetailFieldsToPanelComments,
} from '../comments/groupCommentDetailFieldsToPanelComments';

const PAGE_SIZE = 50;

export type PublicCommentsForMediaItemContainerProps = {
  mediaItemId: string;
};

export const PublicCommentsForMediaItemContainer = ({
  mediaItemId,
}: PublicCommentsForMediaItemContainerProps): JSX.Element => {
  const { data, loading, error, refetch } = useQuery(CommentsForPublicMediaItemDocument, {
    variables: { mediaItemId, limit: PAGE_SIZE, offset: 0 },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const rawNodes = data?.publicAccess?.mediaItem?.comments?.nodes;
  const comments = useMemo(
    () => groupCommentDetailFieldsToPanelComments(rawNodes ?? []),
    [rawNodes],
  );
  const count = countVisiblePanelComments(comments);
  const titleText = rawNodes != null ? `Comments · ${count}` : 'Comments';

  const err: Error | null =
    error != null ? (error instanceof Error ? error : new Error('Failed to load comments')) : null;

  return (
    <Root>
      <SectionTitle>{titleText}</SectionTitle>
      <CommentsPanel
        comments={comments}
        loading={loading}
        error={err}
        canComment={false}
        viewerUserId={null}
        onRetry={() => void refetch()}
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
