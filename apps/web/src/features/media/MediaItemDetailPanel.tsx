import { Operation } from '@packages/contracts';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import styled from 'styled-components';
import { formatDateOnly, formatTakenDisplay } from '../../domain/formatters/mediaItemMetaFormat';
import type { MediaItemDetailVM } from '../../viewModels/';
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
};

export const MediaItemDetailPanel = forwardRef<
  MediaItemDetailPanelHandle,
  MediaItemDetailPanelProps
>(({ mediaItem, onDismissScreen, onSaved, onEditingSessionChange }, ref) => {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
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
  const renderEditableRow = (label: string, value?: string, muted?: boolean) => (
    <EditableRowButton disabled={!canEdit} type="button" onClick={openEditDetails}>
      <RowFieldLabel>{label}</RowFieldLabel>
      <EditableRowValueRow>
        <EditableValueText $multiline $muted={muted != null ? muted : !value?.trim()}>
          {value?.trim() ? value.trim() : 'Not set'}
        </EditableValueText>
        {canEdit && <EditCue aria-hidden>✎</EditCue>}
      </EditableRowValueRow>
    </EditableRowButton>
  );

  return (
    <MetadataPanel>
      <MetadataSection>
        <DetailsPanelHeader>
          <DetailsSectionTitle>Details</DetailsSectionTitle>
          <DetailsPanelCloseButton type="button" onClick={handleCloseRequest} aria-label="Close">
            ✕
          </DetailsPanelCloseButton>
        </DetailsPanelHeader>
        <MetadataItem>
          <MetadataLabel>File name</MetadataLabel>
          <MetadataValue>{mediaItem.originalFileName?.trim() || '—'}</MetadataValue>
        </MetadataItem>

        {isEditingDetails ? (
          <MediaItemDetailForm
            mediaItem={mediaItem}
            onSaved={onSaved}
            onFinishEditing={endEditingSession}
          />
        ) : (
          <>
            {renderEditableRow('Title', mediaItem.title)}
            {renderEditableRow('Description', mediaItem.description)}
            {renderEditableRow(
              'Taken',
              formatTakenDisplay(mediaItem.takenAt),
              mediaItem.takenAt?.isValid,
            )}
          </>
        )}

        <MetadataItem>
          <MetadataLabel>Date added</MetadataLabel>
          <MetadataValue>{formatDateOnly(mediaItem.createdAt)}</MetadataValue>
        </MetadataItem>
      </MetadataSection>

      <CommentsSection>
        <CommentsForViewerMediaItemContainer mediaItemId={mediaItem.id} canComment={canComment} />
      </CommentsSection>
    </MetadataPanel>
  );
});

MediaItemDetailPanel.displayName = 'MediaItemDetailPanel';

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

const RowFieldLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EditableRowValueRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  border: 1px dashed ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
`;

const EditableRowButton = styled.button`
  all: unset;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
  cursor: pointer;

  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-sizing: border-box;
  width: 100%;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  &:hover ${EditableRowValueRow} {
    border-color: ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.body};
  }

  &:disabled {
    cursor: default;
    ${EditableRowValueRow} {
      border: none;
      background: ${({ theme }) => theme.color.bodyRaised};
    }
  }
`;

const EditableValueText = styled.div<{ $multiline?: boolean; $muted?: boolean }>`
  font-size: 14px;
  color: ${({ theme, $muted }) => ($muted ? theme.color.bodyTextSecondary : theme.color.bodyText)};
  flex: 1;
  min-width: 0;
  text-align: left;
  overflow-wrap: break-word;
  white-space: ${({ $multiline }) => ($multiline ? 'pre-wrap' : 'normal')};
  font-style: ${({ $muted }) => ($muted ? 'italic' : 'normal')};
`;

const EditCue = styled.span`
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1.4;
  opacity: 0.45;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const CommentsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  border-top: 1px solid ${({ theme }) => theme.color.border};
`;
