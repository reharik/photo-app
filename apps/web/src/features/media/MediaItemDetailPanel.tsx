import { useFragment } from '@apollo/client/react';
import { Operation } from '@packages/contracts';
import { X } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MediaItemCommentCountFragmentDoc } from '../../graphql/generated/types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BottomSheet } from '../../ui/BottomSheet';
import { formatActivityDate } from '../../ui/dateDisplay';
import type { MediaItemDetailVM } from '../../viewModels/';
import { hasRailSubstantiveContent } from './detail/hasRailSubstantiveContent';
import { MediaItemDetailRailFields } from './detail/MediaItemDetailRailFields';
import { MediaItemDetailRailReactions } from './detail/MediaItemDetailRailReactions';
import {
  CommentsSection,
  ConversationMetadataZone,
  DescriptiveMetadataZone,
  DetailsPanelCloseButton,
  MetadataPanelStack,
  RailHeader,
  SheetContentZone,
} from './detail/mobileMetadataLayout';

import { CommentsForViewerMediaItemContainer } from './CommentsForViewerMediaItemContainer';
import { PhotoDetailsDisclosure } from './detail/PhotoDetailsDisclosure';
import { MediaItemDetailForm } from './MediaItemDetailForm';
import type { MobileViewerSheet } from './viewer/mediaViewerTypes';

export type MediaItemDetailPanelHandle = {
  /** Cancels an active edit, or runs {@link MediaItemDetailPanelProps.onDismissScreen} when not editing. */
  handleCloseRequest: () => void;
  /** Ends an active edit when a mobile sheet is dismissed (no navigation). */
  handleSheetDismiss: () => void;
};

export type MediaItemDetailPanelProps = {
  mediaItem: MediaItemDetailVM | undefined;
  onDismissScreen: () => void;
  onSaved: () => Promise<void>;
  /** Notified synchronously when the user enters or leaves detail editing (e.g. to block gallery navigation). */
  onEditingSessionChange?: (isEditing: boolean) => void;
  activeMobileSheet?: MobileViewerSheet;
  onCloseMobileSheet?: () => void;
  onRequestOpenInfoSheet?: () => void;
};

const MOBILE_LAYOUT_MEDIA = '(max-width: 968px)';

export const MediaItemDetailPanel = forwardRef<
  MediaItemDetailPanelHandle,
  MediaItemDetailPanelProps
>(
  (
    {
      mediaItem,
      onDismissScreen,
      onSaved,
      onEditingSessionChange,
      activeMobileSheet = 'none',
      onCloseMobileSheet,
      onRequestOpenInfoSheet,
    },
    ref,
  ) => {
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const isMobileLayout = useMediaQuery(MOBILE_LAYOUT_MEDIA);
    const onEditingSessionChangeRef = useRef(onEditingSessionChange);
    onEditingSessionChangeRef.current = onEditingSessionChange;

    const { data: commentCountData, complete: commentCountKnown } = useFragment({
      fragment: MediaItemCommentCountFragmentDoc,
      fragmentName: 'MediaItemCommentCount',
      from: {
        __typename: 'MediaItem',
        id: mediaItem?.id ?? '',
      },
    });

    useEffect(() => {
      setIsEditingDetails(false);
      onEditingSessionChangeRef.current?.(false);
    }, [mediaItem?.id]);

    const endEditingSession = useCallback((): void => {
      setIsEditingDetails(false);
      onEditingSessionChangeRef.current?.(false);
    }, []);

    const openEditDetails = useCallback((): void => {
      setIsEditingDetails(true);
      onEditingSessionChangeRef.current?.(true);
      onRequestOpenInfoSheet?.();
    }, [onRequestOpenInfoSheet]);

    const handleCloseRequest = useCallback((): void => {
      if (isEditingDetails) {
        endEditingSession();
        return;
      }
      onDismissScreen();
    }, [endEditingSession, isEditingDetails, onDismissScreen]);

    const handleSheetDismiss = useCallback((): void => {
      if (isEditingDetails) {
        endEditingSession();
      }
    }, [endEditingSession, isEditingDetails]);

    const handleMobileSheetClose = useCallback((): void => {
      handleSheetDismiss();
      onCloseMobileSheet?.();
    }, [handleSheetDismiss, onCloseMobileSheet]);

    useImperativeHandle(ref, () => ({ handleCloseRequest, handleSheetDismiss }), [
      handleCloseRequest,
      handleSheetDismiss,
    ]);

    if (mediaItem == null) {
      return null;
    }

    const canEdit = mediaItem.operations.includes(Operation.editMediaItem);
    const canComment = mediaItem.operations.includes(Operation.comment);

    const dateAdded = mediaItem.createdAt?.isValid
      ? formatActivityDate(mediaItem.createdAt)
      : undefined;
    const photoDetailRows = [
      mediaItem.originalFileName?.trim()
        ? { label: 'File name', value: mediaItem.originalFileName.trim() }
        : undefined,
      dateAdded != null ? { label: 'Date added', value: dateAdded } : undefined,
    ].filter((row) => row != null);

    const commentTotalCount = commentCountData?.comments?.totalCount;
    const expandPhotoDetailsByDefault =
      commentCountKnown &&
      !hasRailSubstantiveContent({
        title: mediaItem.title,
        description: mediaItem.description,
        reactionTotal: mediaItem.reactionCounts.total,
        commentCount: commentTotalCount ?? 0,
      });
    const photoDetailsDisclosureKey = commentCountKnown
      ? `${mediaItem.id}-comments-known`
      : `${mediaItem.id}-comments-pending`;

    const photoDetails = (
      <PhotoDetailsDisclosure
        key={photoDetailsDisclosureKey}
        rows={photoDetailRows}
        defaultExpanded={commentCountKnown ? expandPhotoDetailsByDefault : false}
      />
    );

    const railFields = (
      <MediaItemDetailRailFields
        mediaItem={mediaItem}
        canEdit={canEdit}
        isEditingDetails={isEditingDetails}
        onOpenEdit={openEditDetails}
        editForm={
          isEditingDetails ? (
            <MediaItemDetailForm
              mediaItem={mediaItem}
              onSaved={onSaved}
              onFinishEditing={endEditingSession}
            />
          ) : undefined
        }
      />
    );

    const reactions = (
      <MediaItemDetailRailReactions
        mediaItemId={mediaItem.id}
        reactionCounts={mediaItem.reactionCounts}
        viewerReactions={mediaItem.viewerReactions}
        onRefetch={onSaved}
      />
    );

    const comments = (
      <CommentsSection>
        <CommentsForViewerMediaItemContainer
          mediaItemId={mediaItem.id}
          canComment={canComment}
          layout="rail"
        />
      </CommentsSection>
    );

    if (isMobileLayout) {
      return (
        <>
          <BottomSheet
            open={activeMobileSheet === 'info'}
            onClose={handleMobileSheetClose}
            ariaLabel="Media Item information"
          >
            <SheetContentZone>
              {railFields}
              {photoDetails}
            </SheetContentZone>
          </BottomSheet>

          <BottomSheet
            open={activeMobileSheet === 'comment'}
            onClose={handleMobileSheetClose}
            ariaLabel="Comments"
          >
            <SheetContentZone>
              {reactions}
              {comments}
            </SheetContentZone>
          </BottomSheet>
        </>
      );
    }

    return (
      <MetadataPanelStack>
        <DescriptiveMetadataZone>
          <RailHeader>
            <DetailsPanelCloseButton type="button" onClick={handleCloseRequest} aria-label="Close">
              <X size={20} strokeWidth={2} aria-hidden />
            </DetailsPanelCloseButton>
          </RailHeader>

          {railFields}

          {photoDetails}
        </DescriptiveMetadataZone>

        <ConversationMetadataZone>
          {reactions}
          {comments}
        </ConversationMetadataZone>
      </MetadataPanelStack>
    );
  },
);

MediaItemDetailPanel.displayName = 'MediaItemDetailPanel';
