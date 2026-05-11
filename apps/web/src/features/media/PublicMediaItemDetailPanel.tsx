import { forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import type { PublicMediaItemSummaryVM } from '../../viewModels/publicMedia/PublicMediaItemSummaryVM';
import { PublicCommentsForMediaItemContainer } from './PublicCommentsForMediaItemContainer';

export type PublicMediaItemDetailPanelHandle = {
  /** Cancels an active edit, or runs {@link PublicMediaItemDetailPanelProps.onDismissScreen} when not editing. */
  handleCloseRequest: () => void;
};

export type PublicMediaItemDetailPanelProps = {
  mediaItem: PublicMediaItemSummaryVM | undefined;
  onDismissScreen: () => void;
};

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
>(({ mediaItem, onDismissScreen }, ref) => {
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
  const hasDimensions =
    mediaItem.width != null &&
    mediaItem.height != null &&
    mediaItem.width > 0 &&
    mediaItem.height > 0;
  const hasDuration = mediaItem.durationSeconds != null && mediaItem.durationSeconds > 0;

  return (
    <MetadataPanel>
      <MetadataSection>
        <DetailsPanelHeader>
          <DetailsSectionTitle>Details</DetailsSectionTitle>
          <DetailsPanelCloseButton type="button" onClick={onDismissScreen} aria-label="Close">
            ✕
          </DetailsPanelCloseButton>
        </DetailsPanelHeader>

        <ReadOnlyFieldBlock>
          <RowFieldLabel>Title</RowFieldLabel>
          <ReadOnlyValueShell>
            <ReadOnlyValueText $muted={!titleText}>
              {titleText ? titleText : 'Not set'}
            </ReadOnlyValueText>
          </ReadOnlyValueShell>
        </ReadOnlyFieldBlock>

        <MetadataItem>
          <MetadataLabel>Kind</MetadataLabel>
          <MetadataValue>{mediaItem.kind.display}</MetadataValue>
        </MetadataItem>

        {hasDimensions ? (
          <MetadataItem>
            <MetadataLabel>Dimensions</MetadataLabel>
            <MetadataValue>
              {mediaItem.width} × {mediaItem.height}
            </MetadataValue>
          </MetadataItem>
        ) : null}

        {hasDuration ? (
          <MetadataItem>
            <MetadataLabel>Duration</MetadataLabel>
            <MetadataValue>{formatDurationSeconds(mediaItem.durationSeconds ?? 0)}</MetadataValue>
          </MetadataItem>
        ) : null}
      </MetadataSection>

      <CommentsSection>
        <PublicCommentsForMediaItemContainer mediaItemId={mediaItem.id} />
      </CommentsSection>
    </MetadataPanel>
  );
});

PublicMediaItemDetailPanel.displayName = 'PublicMediaItemDetailPanel';

const MetadataPanel = styled.aside`
  width: 320px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  border-left: 1px solid ${({ theme }) => theme.color.border};
  padding: ${({ theme }) => theme.spacing(4)};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};

  @media (max-width: 968px) {
    /* Match {@link MediaViewer} ViewerCard width; inset by horizontal padding */
    width: min(960px, calc(100% - ${({ theme }) => theme.spacing(8)}));
    max-width: 960px;
    margin-inline: auto;
    border-left: none;
    border: 1px solid ${({ theme }) => theme.color.border};
    border-radius: ${({ theme }) => theme.borderRadius.xl};
    flex: 0 0 auto;
    overflow: hidden;
    padding-bottom: max(${({ theme }) => theme.spacing(6)}, env(safe-area-inset-bottom, 0px));
  }
`;

const MetadataSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const DetailsPanelHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const DetailsSectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  margin: 0 0 ${({ theme }) => theme.spacing(1)} 0;
  flex: 1;
  min-width: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailsPanelCloseButton = styled.button`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.body};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
    background: ${({ theme }) => theme.color.bodyRaised};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  @media (max-width: 968px) {
    display: none;
  }
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
`;

const MetadataLabel = styled.label`
  font-size: 12px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetadataValue = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.color.bodyText};
`;

/** Mirrors disabled {@link MediaItemDetailPanel} editable row layout (no dashed border). */
const ReadOnlyFieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
`;

const RowFieldLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ReadOnlyValueShell = styled.div`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  border: none;
  background: ${({ theme }) => theme.color.bodyRaised};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const ReadOnlyValueText = styled.div<{ $muted?: boolean }>`
  font-size: 14px;
  color: ${({ theme, $muted }) => ($muted ? theme.color.bodyTextSecondary : theme.color.bodyText)};
  flex: 1;
  min-width: 0;
  text-align: left;
  overflow-wrap: break-word;
  white-space: normal;
  font-style: ${({ $muted }) => ($muted ? 'italic' : 'normal')};
`;

const CommentsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  border-top: 1px solid ${({ theme }) => theme.color.border};
`;
