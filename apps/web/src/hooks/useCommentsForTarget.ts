import { useQuery } from '@apollo/client/react';
import { CommentTargetType } from '@packages/contracts';
import { ReactNode } from 'react';
import {
  CommentsForPublicAlbumDocument,
  CommentsForPublicMediaItemDocument,
  CommentsForViewerAlbumDocument,
  CommentsForViewerMediaItemDocument,
} from '../graphql/generated/types';
import { CommentDetailVM } from '../viewModels/comment/CommentDetailVM';
import { mapMultipleCommentDetailFieldsToVMs } from '../viewModels/comment/mapCommentDetailFieldsToVM';
import { getQueryRenderState } from './getQueryRenderState';

export type UseCommentsForTargetResult = {
  data: CommentDetailVM[] | undefined;
  content: ReactNode | undefined;
  refetch: () => void;
};

const PAGE_SIZE = 50;

type Props = {
  targetType: CommentTargetType;
  targetId: string;
  isPublicAccess: boolean;
};

export const useCommentsForTarget = ({
  targetType,
  targetId,
  isPublicAccess,
}: Props): UseCommentsForTargetResult => {
  const skipViewerMediaItem =
    isPublicAccess || targetType !== CommentTargetType.mediaItem || !targetId;
  const skipViewerAlbum = isPublicAccess || targetType !== CommentTargetType.album || !targetId;
  const skipPublicMediaItem =
    !isPublicAccess || targetType !== CommentTargetType.mediaItem || !targetId;
  const skipPublicAlbum = !isPublicAccess || targetType !== CommentTargetType.album;

  const viewerMediaItemQuery = useQuery(CommentsForViewerMediaItemDocument, {
    variables: { mediaItemId: targetId, limit: PAGE_SIZE, offset: 0 },
    skip: skipViewerMediaItem,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const viewerAlbumQuery = useQuery(CommentsForViewerAlbumDocument, {
    variables: { albumId: targetId, limit: PAGE_SIZE, offset: 0 },
    skip: skipViewerAlbum,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const publicMediaItemQuery = useQuery(CommentsForPublicMediaItemDocument, {
    variables: { mediaItemId: targetId, limit: PAGE_SIZE, offset: 0 },
    skip: skipPublicMediaItem,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const publicAlbumQuery = useQuery(CommentsForPublicAlbumDocument, {
    variables: { limit: PAGE_SIZE, offset: 0 },
    skip: skipPublicAlbum,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  if (!skipViewerMediaItem) {
    return getQueryRenderState({
      query: viewerMediaItemQuery,
      select: (data) => data?.viewer?.mediaItem?.comments?.nodes,
      map: mapMultipleCommentDetailFieldsToVMs,
    });
  }

  if (!skipViewerAlbum) {
    return getQueryRenderState({
      query: viewerAlbumQuery,
      select: (data) => data?.viewer?.album?.comments?.nodes,
      map: mapMultipleCommentDetailFieldsToVMs,
    });
  }

  if (!skipPublicMediaItem) {
    return getQueryRenderState({
      query: publicMediaItemQuery,
      select: (data) => data?.publicAccess?.mediaItem?.comments?.nodes,
      map: mapMultipleCommentDetailFieldsToVMs,
    });
  }

  return getQueryRenderState({
    query: publicAlbumQuery,
    select: (data) => data?.publicAccess?.album?.comments?.nodes,
    map: mapMultipleCommentDetailFieldsToVMs,
  });
};
