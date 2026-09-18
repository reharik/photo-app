import { useApolloClient, useQuery } from '@apollo/client/react';
import { AlbumItemSortBy, EntityType, InAppNotificationType, SortDir } from '@packages/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { AlbumSection } from '../features/albums/AlbumSection';
import type { AlbumGroupBy } from '../features/albums/AlbumSectionMetadata';
import {
  mediaGridRestorationKeys,
  useRestoreAwareFetchPolicy,
} from '../features/media/grid/useMediaGridScrollRestoration';
import {
  AddMediaItemsToAlbumDocument,
  AddMediaItemsToAlbumMutation,
  DeleteAlbumItemsFromAlbumDocument,
  DeleteAlbumItemsFromAlbumMutation,
  MarkSurfaceSeenDocument,
  MediaItemSortBy,
  SetCoverMediaDocument,
  SetCoverMediaMutation,
  ViewerAlbumDetailDocument,
  ViewerInAppNotificationDocument,
  ViewerLibraryDocument,
  ViewerSharedWithMeAlbumsDocument,
} from '../graphql/generated/types';
import { usePaginatedQueryRenderState } from '../hooks/getPaginatedQueryRenderState';
import { useAppMutationState } from '../hooks/useAppMutation';
import { DEFAULT_PAGE_SIZE, useCachedFirstPageLimit } from '../hooks/useCachedFirstPageLimit';
import { useInAppNotification } from '../hooks/useInAppNotification';
import { NotFoundState } from '../ui/NotFoundState';
import { Toast } from '../ui/Toast';

/** URL search params for the album view; defaults (ungrouped, newest first) are omitted. */
const GROUP_PARAM = 'group';
const SORT_PARAM = 'sort';

export const AlbumScreen = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [addAlbumItemModalOpen, setAddAlbumItemModalOpen] = useState(false);
  const [removeFromAlbumOpen, setRemoveFromAlbumOpen] = useState(false);
  const [shareAlbumOpen, setShareAlbumOpen] = useState(false);
  const [addCoverItemOpen, setAddCoverItemOpen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const addToAlbumMutation = useAppMutationState();
  const removeFromAlbumMutation = useAppMutationState();
  const addAlbumCoverMutation = useAppMutationState();
  const apolloClient = useApolloClient();
  const { anyUnseenMatching } = useInAppNotification();
  const markedSeenAlbumIdRef = useRef<string | null>(null);
  // The view (grouping + sort direction) lives in the URL and is the source of truth for the
  // query variables, so back navigation remounts with the same view — and therefore reads the
  // same cached list (Album.items is keyed by sort) and can take the serve-from-cache path.
  const [searchParams, setSearchParams] = useSearchParams();
  const groupBy: AlbumGroupBy =
    searchParams.get(GROUP_PARAM) === 'takenDate' ? 'takenDate' : 'ungrouped';
  const sortDir: SortDir = searchParams.get(SORT_PARAM) === 'asc' ? SortDir.asc : SortDir.desc;

  const handleGroupByChange = useCallback(
    (next: AlbumGroupBy): void => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === 'ungrouped') {
            params.delete(GROUP_PARAM);
          } else {
            params.set(GROUP_PARAM, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleSortDirChange = useCallback(
    (next: SortDir): void => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next.equals(SortDir.desc)) {
            params.delete(SORT_PARAM);
          } else {
            params.set(SORT_PARAM, 'asc');
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const buildPageVariables = useCallback(
    (offset: number, limit: number = DEFAULT_PAGE_SIZE) => {
      return {
        albumId: albumId ?? '',
        collectionInfo: {
          pageInfo: { limit, offset },
          sortBy: groupBy === 'takenDate' ? AlbumItemSortBy.takenAt : AlbumItemSortBy.createdAt,
          sortDir,
        },
      };
    },
    [albumId, groupBy, sortDir],
  );

  // Keyed like Album.items keyArgs (sort only), plus the album.
  const { limit: firstPageLimit, cachedCount } = useCachedFirstPageLimit({
    query: ViewerAlbumDetailDocument,
    firstPageVariables: buildPageVariables(0),
    countCachedNodes: (data) => data.viewer?.album?.items?.nodes.length,
    cacheKey: `${albumId}:${groupBy}:${sortDir.value}`,
  });
  // Decided once per mount. On a sort change Apollo's string nextFetchPolicy resets to the
  // initial fetch policy ("variables-changed"); the sort-change effect's explicit refetch is
  // what forces the network.
  const { fetchPolicy, nextFetchPolicy } = useRestoreAwareFetchPolicy({
    restorationKey: mediaGridRestorationKeys.album(albumId ?? ''),
    cachedCount,
  });

  const query = useQuery(ViewerAlbumDetailDocument, {
    variables: {
      ...buildPageVariables(0, firstPageLimit),
    },
    skip: !albumId,
    fetchPolicy,
    nextFetchPolicy,
    // MediaGrid scroll restoration's settle detection (paging.isSettled) depends on this.
    notifyOnNetworkStatusChange: true,
  });

  const {
    data: albumData,
    content,
    refetch,
    paging,
  } = usePaginatedQueryRenderState({
    query,
    select: (data) => {
      if (!data.viewer?.album) {
        return undefined;
      }

      const { items, ...album } = data.viewer.album;
      return {
        album,
        nodes: items?.nodes ?? [],
        totalCount: items?.totalCount ?? 0,
      };
    },
    buildPageVariables,
  });

  // Refetch only when the (URL-parsed) sort actually changes. Compared against the previous
  // values rather than a first-run flag: StrictMode re-runs mount effects, and with a flag
  // that second run forced a network refetch that replaced a cache-served list with one
  // capped page.
  const lastSortRef = useRef({ groupBy, sortDir });
  useEffect(() => {
    const last = lastSortRef.current;
    if (last.groupBy === groupBy && last.sortDir.equals(sortDir)) {
      return;
    }
    lastSortRef.current = { groupBy, sortDir };
    void query.refetch(buildPageVariables(0, firstPageLimit));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, sortDir]); // ONLY sort inputs — not query, not buildPageVariables

  // Opening an album = seeing its container-level activity. Surface-clear once the
  // detail resolves, once per album. Kind-scoped: an album can carry itemAdded (new
  // media in my album) and/or albumShared (a shared album). We clear BOTH kinds —
  // each is a no-op for the album that doesn't have it, and albums never carry
  // comment rows, so there is no collision with the deferred comment id-clear.
  // Best-effort: failures are logged, not surfaced.
  const loadedAlbumId = albumData?.album?.id;
  useEffect(() => {
    if (loadedAlbumId == null || markedSeenAlbumIdRef.current === loadedAlbumId) {
      return;
    }
    // Clear only the kinds the client actually holds a row for at this album — skip the
    // mutation(s) AND the refetch entirely when there's nothing to clear (empty round-trip).
    // If the array hasn't resolved yet this is empty and the effect re-runs when it does.
    const kinds = [InAppNotificationType.itemAdded, InAppNotificationType.albumShared].filter(
      (kind) =>
        anyUnseenMatching(
          (r) =>
            r.containerType.equals(EntityType.album) &&
            r.containerId === loadedAlbumId &&
            r.kind.equals(kind),
        ),
    );
    if (kinds.length === 0) {
      return;
    }
    markedSeenAlbumIdRef.current = loadedAlbumId;

    void (async () => {
      try {
        await Promise.all(
          kinds.map((kind) =>
            apolloClient.mutate({
              mutation: MarkSurfaceSeenDocument,
              variables: { containerType: EntityType.album, containerId: loadedAlbumId, kind },
            }),
          ),
        );
        void apolloClient.refetchQueries({
          include: [ViewerInAppNotificationDocument, ViewerSharedWithMeAlbumsDocument],
        });
      } catch (error) {
        console.error('markSurfaceSeen failed for album', loadedAlbumId, error);
      }
    })();
  }, [loadedAlbumId, anyUnseenMatching, apolloClient]);

  // replace the bare useQuery with the paginated hook
  const buildPickerVariables = useCallback(
    (offset: number) => ({
      collectionInfo: {
        pageInfo: { limit: 20, offset },
        sortBy: MediaItemSortBy.createdAt,
        sortDir: SortDir.desc,
      },
    }),
    [],
  );

  const mediaItemsForPickerQuery = useQuery(ViewerLibraryDocument, {
    variables: buildPickerVariables(0),
    skip: !addAlbumItemModalOpen,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  // select returns the UNFILTERED page: paging derives hasMore and the next offset from
  // nodes.length, which must match what was fetched. Filtering out items already in the
  // album here made hasMore stick true and loadMore re-request overlapping pages
  // (duplicate tiles). The album filter is applied below, when building pickerMediaItems.
  const pickerState = usePaginatedQueryRenderState({
    query: mediaItemsForPickerQuery,
    select: (data) => ({
      nodes: data?.viewer?.mediaItems.nodes ?? [],
      totalCount: data.viewer?.mediaItems.totalCount ?? 0,
    }),
    buildPageVariables: buildPickerVariables,
  });

  const album = albumData?.album;
  const albumItems = albumData?.nodes ?? [];
  const totalCount = albumData?.totalCount ?? 0;
  const albumMediaItemIds = new Set(albumItems.map((albumItem) => albumItem.mediaItem.id));
  const pickerMediaItems = (pickerState.data?.nodes ?? []).filter(
    (item) => !albumMediaItemIds.has(item.id),
  );
  if (!album || !album?.id) {
    // Settled with a null album = missing or not visible to this viewer (the API doesn't
    // distinguish). Previously select threw here and the app error boundary rendered
    // "Something went wrong".
    const isNotFound = query.data != null && query.data.viewer?.album == null;
    return isNotFound ? <NotFoundState title="This album isn't available" /> : content;
  }

  const submitAddToAlbum = async (newAlbumItemIds: string[]) => {
    const result = await addToAlbumMutation.execute(
      {
        mutation: AddMediaItemsToAlbumDocument,
        variables: {
          input: {
            mediaItemIds: newAlbumItemIds,
            albumId: album.id,
          },
        },
      },
      (data: AddMediaItemsToAlbumMutation) => data.AddMediaItemsToAlbum,
    );

    if (result.success) {
      setAddAlbumItemModalOpen(false);
      setShowSaveToast(true);
      void query.refetch();
    }
  };

  const submitRemoveFromAlbum = async (selectedAlbumItemIds: string[]) => {
    const result = await removeFromAlbumMutation.execute(
      {
        mutation: DeleteAlbumItemsFromAlbumDocument,
        variables: {
          input: {
            albumId: album.id,
            albumItemIds: selectedAlbumItemIds,
          },
        },
      },
      (data: DeleteAlbumItemsFromAlbumMutation) => data.DeleteAlbumItemsFromAlbum,
    );

    if (result.success) {
      setRemoveFromAlbumOpen(false);
      setShowSaveToast(true);
      void query.refetch();
    }
  };

  const submitAddAlbumCover = async (selectedAlbumItemId: string) => {
    const result = await addAlbumCoverMutation.execute(
      {
        mutation: SetCoverMediaDocument,
        variables: {
          input: {
            albumId: album.id,
            albumItemId: selectedAlbumItemId,
          },
        },
      },
      (data: SetCoverMediaMutation) => data.SetCoverMedia,
    );

    if (result.success) {
      setRemoveFromAlbumOpen(false);
      void query.refetch();
    }
  };

  const addAlbumItemState = {
    addItemOpen: addAlbumItemModalOpen,
    setAddItemOpen: setAddAlbumItemModalOpen,
    submitAddToAlbum: submitAddToAlbum,
    pickerMediaItems,
    pickerTotalCount: pickerState.data?.totalCount ?? 0,
    pickerPaging: pickerState.paging,
    pickerRefetch: pickerState.refetch,
  };
  const removeAlbumItemState = {
    removeItemOpen: removeFromAlbumOpen,
    setRemoveItemOpen: setRemoveFromAlbumOpen,
    submitRemoveFromAlbum: submitRemoveFromAlbum,
    removeFromAlbumMutation: removeFromAlbumMutation,
  };
  const modalState = {
    shareAlbumOpen,
    setShareAlbumOpen,
    addCoverItemOpen,
    setAddCoverItemOpen,
  };
  return (
    <Container>
      {showSaveToast ? <Toast onDismiss={() => setShowSaveToast(false)} /> : null}
      {album && (
        <AlbumSection
          album={album}
          paging={paging}
          albumItems={albumItems}
          totalCount={totalCount}
          groupBy={groupBy}
          sortDir={sortDir}
          onGroupByChange={handleGroupByChange}
          onSortDirChange={handleSortDirChange}
          addAlbumItemState={addAlbumItemState}
          removeAlbumItemState={removeAlbumItemState}
          modalState={modalState}
          retrieveAlbumItems={query.refetch}
          submitAddAlbumCover={submitAddAlbumCover}
          reloadData={refetch}
        />
      )}
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;
