import { ReactionEmoji } from '@packages/contracts';
import { forwardRef, useCallback, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { BottomSheet } from '../../ui/BottomSheet';
import type { PublicMediaItemSummaryVM } from '../../viewModels/';
import { hasRailSubstantiveContent } from './detail/hasRailSubstantiveContent';
import { MediaKindRailLabel } from './detail/MediaKindRailLabel';
import {
  CommentsSection,
  ConversationMetadataZone,
  DescriptiveMetadataZone,
  DetailsPanelCloseButton,
  MetadataPanelStack,
  RailHeader,
  SheetContentZone,
} from './detail/mobileMetadataLayout';
import { PhotoDetailsDisclosure } from './detail/PhotoDetailsDisclosure';
import { PublicMediaItemDetailRailReactions } from './detail/PublicMediaItemDetailRailReactions';
import { PublicCommentsForMediaItemContainer } from './PublicCommentsForMediaItemContainer';
import type { MobileViewerSheet } from './viewer/mediaViewerTypes';

export type PublicMediaItemDetailPanelHandle = {
  handleCloseRequest: () => void;
};

export type PublicMediaItemDetailPanelProps = {
  mediaItem: PublicMediaItemSummaryVM | undefined;
  onDismissScreen: () => void;
  activeMobileSheet?: MobileViewerSheet;
  onCloseMobileSheet?: () => void;
};

const MOBILE_LAYOUT_MEDIA = '(max-width: 968px)';

const formatDurationSeconds = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export const PublicMediaItemDetailPanel = forwardRef<
  PublicMediaItemDetailPanelHandle,
  PublicMediaItemDetailPanelProps
>(({ mediaItem, onDismissScreen, activeMobileSheet = 'none', onCloseMobileSheet }, ref) => {
  const isMobileLayout = useMediaQuery(MOBILE_LAYOUT_MEDIA);

  const handleMobileSheetClose = useCallback((): void => {
    onCloseMobileSheet?.();
  }, [onCloseMobileSheet]);

  useImperativeHandle(
    ref,
    () => ({
      handleCloseRequest: (): void => {
        onDismissScreen();
      },
    }),
    [onDismissScreen],
  );

  if (mediaItem == null) {
    return null;
  }

  const titleText = mediaItem.title?.trim();
  const heartCount =
    mediaItem.reactionCounts.byEmoji.find((entry) => entry.emoji.equals(ReactionEmoji.heart))
      ?.count ?? 0;
  const showPublicReactions = heartCount > 0;

  const hasDimensions =
    mediaItem.width != null &&
    mediaItem.height != null &&
    mediaItem.width > 0 &&
    mediaItem.height > 0;
  const hasDuration = mediaItem.durationSeconds != null && mediaItem.durationSeconds > 0;

  const photoDetailRows = [
    hasDimensions
      ? { label: 'Dimensions', value: `${mediaItem.width} × ${mediaItem.height}` }
      : undefined,
    hasDuration
      ? { label: 'Duration', value: formatDurationSeconds(mediaItem.durationSeconds ?? 0) }
      : undefined,
  ].filter((row) => row != null);

  const expandPhotoDetailsByDefault = !hasRailSubstantiveContent({
    title: mediaItem.title,
    description: undefined,
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

  const titleOrKind =
    titleText != null ? (
      <TitleText>{titleText}</TitleText>
    ) : (
      <MediaKindRailLabel kind={mediaItem.kind} />
    );

  const conversationZone = (
    <ConversationMetadataZone>
      {showPublicReactions ? (
        <PublicMediaItemDetailRailReactions reactionCounts={mediaItem.reactionCounts} />
      ) : null}

      <CommentsSection $showTopRule={showPublicReactions}>
        <PublicCommentsForMediaItemContainer mediaItemId={mediaItem.id} layout="rail" />
      </CommentsSection>
    </ConversationMetadataZone>
  );

  if (isMobileLayout) {
    return (
      <>
        <BottomSheet
          open={activeMobileSheet === 'info'}
          onClose={handleMobileSheetClose}
          ariaLabel="Photo information"
        >
          <SheetContentZone>
            {titleOrKind}
            {photoDetails}
          </SheetContentZone>
        </BottomSheet>

        <MetadataPanelStack>{conversationZone}</MetadataPanelStack>
      </>
    );
  }

  return (
    <MetadataPanelStack>
      <DescriptiveMetadataZone>
        <RailHeader>
          <DetailsPanelCloseButton type="button" onClick={onDismissScreen} aria-label="Close">
            ✕
          </DetailsPanelCloseButton>
        </RailHeader>

        {titleOrKind}

        {photoDetails}
      </DescriptiveMetadataZone>

      {conversationZone}
    </MetadataPanelStack>
  );
});

PublicMediaItemDetailPanel.displayName = 'PublicMediaItemDetailPanel';

const TitleText = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._18};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.textPrimary};
  line-height: 1.35;
`;
