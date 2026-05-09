import { useQuery } from '@apollo/client/react';
import { CommentTargetType } from '@packages/contracts';
import {
  CommentsForPublicAlbumDocument,
  CommentsForPublicMediaItemDocument,
  CommentsForViewerAlbumDocument,
  CommentsForViewerMediaItemDocument,
  type CommentFieldsFragment,
  type CommentThreadFieldsFragment,
} from '../../../graphql/generated/types';

export type CommentNode = CommentFieldsFragment;
export type CommentWithReplies = CommentThreadFieldsFragment;

export type UseCommentsForTargetResult = {
  comments: CommentWithReplies[];
  totalCount: number;
  loading: boolean;
  error: boolean;
  refetch: () => Promise<unknown>;
};

const PAGE_SIZE = 50;

type Args = {
  targetType: CommentTargetType;
  targetId: string;
  isPublicAccess: boolean;
};

export const useCommentsForTarget = ({
  targetType,
  targetId,
  isPublicAccess,
}: Args): UseCommentsForTargetResult => {
  const skipViewerMediaItem =
    isPublicAccess || targetType !== CommentTargetType.mediaItem || !targetId;
  const skipViewerAlbum = isPublicAccess || targetType !== CommentTargetType.album || !targetId;
  const skipPublicMediaItem =
    !isPublicAccess || targetType !== CommentTargetType.mediaItem || !targetId;
  const skipPublicAlbum = !isPublicAccess || targetType !== CommentTargetType.album;

  const viewerMediaItemQuery = useQuery(CommentsForViewerMediaItemDocument, {
    variables: { mediaItemId: targetId, first: PAGE_SIZE },
    skip: skipViewerMediaItem,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const viewerAlbumQuery = useQuery(CommentsForViewerAlbumDocument, {
    variables: { albumId: targetId, first: PAGE_SIZE },
    skip: skipViewerAlbum,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const publicMediaItemQuery = useQuery(CommentsForPublicMediaItemDocument, {
    variables: { mediaItemId: targetId, first: PAGE_SIZE },
    skip: skipPublicMediaItem,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const publicAlbumQuery = useQuery(CommentsForPublicAlbumDocument, {
    variables: { first: PAGE_SIZE },
    skip: skipPublicAlbum,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  if (!skipViewerMediaItem) {
    const connection = viewerMediaItemQuery.data?.viewer?.mediaItem?.comments;
    return {
      comments: (connection?.edges ?? []).map((e) => e.node),
      totalCount: connection?.totalCount ?? 0,
      loading: viewerMediaItemQuery.loading,
      error: !!viewerMediaItemQuery.error,
      refetch: viewerMediaItemQuery.refetch,
    };
  }

  if (!skipViewerAlbum) {
    const connection = viewerAlbumQuery.data?.viewer?.album?.comments;
    return {
      comments: (connection?.edges ?? []).map((e) => e.node),
      totalCount: connection?.totalCount ?? 0,
      loading: viewerAlbumQuery.loading,
      error: !!viewerAlbumQuery.error,
      refetch: viewerAlbumQuery.refetch,
    };
  }

  if (!skipPublicMediaItem) {
    const connection = publicMediaItemQuery.data?.publicAccess?.mediaItem?.comments;
    return {
      comments: (connection?.edges ?? []).map((e) => e.node),
      totalCount: connection?.totalCount ?? 0,
      loading: publicMediaItemQuery.loading,
      error: !!publicMediaItemQuery.error,
      refetch: publicMediaItemQuery.refetch,
    };
  }

  const connection = publicAlbumQuery.data?.publicAccess?.album?.comments;
  return {
    comments: (connection?.edges ?? []).map((e) => e.node),
    totalCount: connection?.totalCount ?? 0,
    loading: publicAlbumQuery.loading,
    error: !!publicAlbumQuery.error,
    refetch: publicAlbumQuery.refetch,
  };
};
