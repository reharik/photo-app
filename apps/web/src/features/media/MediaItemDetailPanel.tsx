import { Operation } from '@packages/contracts';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { formatDateOnly } from '../../domain/formatters/mediaItemMetaFormat';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { MediaItemDetailVM } from '../../viewModels/';
import { MediaItemDetailRailFields } from './detail/MediaItemDetailRailFields';
import { MediaItemDetailRailReactions } from './detail/MediaItemDetailRailReactions';
import {
  CommentsSection,
  ConversationMetadataZone,
  DescriptiveMetadataZone,
  DetailsPanelCloseButton,
  MetadataPanelStack,
  RailHeader,
} from './detail/mobileMetadataLayout';
import { hasRailSubstantiveContent } from './detail/hasRailSubstantiveContent';
import { PhotoDetailsDisclosure } from './detail/PhotoDetailsDisclosure';
import { CommentsForViewerMediaItemContainer } from './CommentsForViewerMediaItemContainer';
import { MediaItemDetailForm } from './MediaItemDetailForm';

export type MediaItemDetailPanelHandle = {
  /** Cancels an active edit, or runs {@link MediaItemDetailPanelProps.onDismissScreen} when not editing. */
  handleCloseRequest: () => void;
};

export type MediaItemDetailPanelProps = {
  mediaItem: MediaItemDetailVM | undefined;
  onDismissScreen: () => void;
  onSaved: () => Promise<void>;
  /** Notified synchronously when the user enters or leaves detail editing (e.g. to block gallery navigation). */
  onEditingSessionChange?: (isEditing: boolean) => void;
  /** On narrow viewports, hides the descriptive cream card when false; conversation stays visible. */
  isMobileMetadataVisible?: boolean;
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
      isMobileMetadataVisible = false,
    },
    ref,
  ) => {
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const isMobileLayout = useMediaQuery(MOBILE_LAYOUT_MEDIA);
    const onEditingSessionChangeRef = useRef(onEditingSessionChange);
    onEditingSessionChangeRef.current = onEditingSessionChange;

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
    }, []);

    const handleCloseRequest = useCallback((): void => {
      if (isEditingDetails) {
        endEditingSession();
        return;
      }
      onDismissScreen();
    }, [endEditingSession, isEditingDetails, onDismissScreen]);

    useImperativeHandle(ref, () => ({ handleCloseRequest }), [handleCloseRequest]);

    if (mediaItem == null) {
      return null;
    }

    const canEdit = mediaItem.operations.includes(Operation.editMediaItem);
    const canComment = mediaItem.operations.includes(Operation.comment);
    const showDescriptiveZone =
      !isMobileLayout || isMobileMetadataVisible || isEditingDetails;

    const dateAdded = formatDateOnly(mediaItem.createdAt);
    const photoDetailRows = [
      mediaItem.originalFileName?.trim()
        ? { label: 'File name', value: mediaItem.originalFileName.trim() }
        : undefined,
      dateAdded != null ? { label: 'Date added', value: dateAdded } : undefined,
    ].filter((row) => row != null);

    const expandPhotoDetailsByDefault = !hasRailSubstantiveContent({
      title: mediaItem.title,
      description: mediaItem.description,
      reactionTotal: mediaItem.reactionCounts.total,
      commentCount: mediaItem.comments.totalCount,
    });

    const photoDetails = (
      <PhotoDetailsDisclosure
        key={mediaItem.id}
        rows={photoDetailRows}
        defaultExpanded={expandPhotoDetailsByDefault}
      />
    );

    return (
      <MetadataPanelStack>
        <DescriptiveMetadataZone $hiddenOnMobile={!showDescriptiveZone}>
          <RailHeader>
            <DetailsPanelCloseButton type="button" onClick={handleCloseRequest} aria-label="Close">
              ✕
            </DetailsPanelCloseButton>
          </RailHeader>

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

          {isMobileLayout ? photoDetails : null}
        </DescriptiveMetadataZone>

        <ConversationMetadataZone>
          <MediaItemDetailRailReactions
            mediaItemId={mediaItem.id}
            reactionCounts={mediaItem.reactionCounts}
            viewerReactions={mediaItem.viewerReactions}
            onRefetch={onSaved}
          />

          <CommentsSection>
            <CommentsForViewerMediaItemContainer
              mediaItemId={mediaItem.id}
              canComment={canComment}
              layout="rail"
            />
          </CommentsSection>
        </ConversationMetadataZone>

        {!isMobileLayout ? photoDetails : null}
      </MetadataPanelStack>
    );
  },
);

MediaItemDetailPanel.displayName = 'MediaItemDetailPanel';
