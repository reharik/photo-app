import { useMutation, useQuery } from '@apollo/client/react';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import type { MediaItemLocationState } from '../app/mediaItemNavigationState';
import {
  UpdateMediaItemDetailsDocument,
  ViewerMediaItemDetailDocument,
} from '../graphql/generated/types';
import { useMediaViewerKeyboard } from '../hooks/useMediaViewerKeyboard';
import { MediaViewer } from '../shared/components/media/MediaViewer';
import type { NavigateDirection } from '../shared/components/media/mediaViewerTypes';

export const MediaItemScreen = () => {
  const { mediaId } = useParams<{ mediaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const galleryIds = (location.state as MediaItemLocationState | undefined)?.mediaGalleryIds;

  const { data, loading, error, refetch } = useQuery(ViewerMediaItemDetailDocument, {
    variables: { mediaItemId: mediaId ?? '' },
    skip: !mediaId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const [updateMediaItemDetails, { loading: saveLoading }] = useMutation(
    UpdateMediaItemDetailsDocument,
  );

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftTakenLocal, setDraftTakenLocal] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  /** Escape resets image zoom first (when {@link MediaViewer} reports zoom active), then closes. */
  const mediaViewerEscapeConsumedRef = useRef<(() => boolean) | null>(null);

  const handleMediaNavigate = useCallback(
    (direction: NavigateDirection) => {
      if (isEditingDetails || mediaId == null || mediaId === '' || galleryIds == null) {
        return;
      }
      if (galleryIds.length === 0 || galleryIds.length <= 1) {
        return;
      }
      const idx = galleryIds.indexOf(mediaId);
      if (idx === -1) {
        return;
      }
      const nextIdx =
        direction === 'next'
          ? (idx + 1) % galleryIds.length
          : (idx - 1 + galleryIds.length) % galleryIds.length;
      const nextId = galleryIds[nextIdx];
      if (nextId === undefined) {
        return;
      }
      void navigate(`/media/${nextId}`, {
        replace: true,
        state: { mediaGalleryIds: galleryIds },
      });
    },
    [galleryIds, isEditingDetails, mediaId, navigate],
  );

  const { canNavigatePrevious, canNavigateNext } = useMemo(() => {
    const none = { canNavigatePrevious: false, canNavigateNext: false };
    if (galleryIds == null || mediaId == null || mediaId === '') {
      return none;
    }
    if (galleryIds.length <= 1) {
      return none;
    }
    if (!galleryIds.includes(mediaId)) {
      return none;
    }
    return { canNavigatePrevious: true, canNavigateNext: true };
  }, [galleryIds, mediaId]);

  const mediaItem = data?.viewer?.mediaItem ?? null;

  const displayUrlRaw = mediaItem != null ? mediaItem.derivedUrls.display : undefined;
  const displayUrl =
    displayUrlRaw != null && isNonEmptyDisplayUrl(displayUrlRaw) ? displayUrlRaw.trim() : null;

  const mimeForViewer = (mediaItem?.mimeType ?? '').trim();

  const cancelEditDetails = useCallback((): void => {
    setIsEditingDetails(false);
    setSaveError(null);
  }, []);

  const handleClose = useCallback((): void => {
    if (isEditingDetails) {
      cancelEditDetails();
      return;
    }
    void navigate(-1);
  }, [cancelEditDetails, isEditingDetails, navigate]);

  const openEditDetails = (): void => {
    if (mediaItem == null) {
      return;
    }
    setDraftTitle(mediaItem.title?.trim() ?? '');
    setDraftDescription(mediaItem.description?.trim() ?? '');
    setDraftTakenLocal(toDatetimeLocalValue(mediaItem.takenAt));
    setSaveError(null);
    setIsEditingDetails(true);
  };

  const viewerChrome = (children: ReactNode) => (
    <ViewerShell>
      <ViewerCard>{children}</ViewerCard>
    </ViewerShell>
  );

  const viewerPane = (() => {
    if (!mediaId) {
      return viewerChrome(<StateText role="alert">Missing media id.</StateText>);
    }
    if (loading) {
      return viewerChrome(<StateText>Loading media…</StateText>);
    }
    if (error) {
      return viewerChrome(
        <StateText role="alert">Could not load media. {error.message}</StateText>,
      );
    }
    if (mediaItem == null) {
      return viewerChrome(
        <StateText>This media was not found or you do not have access.</StateText>,
      );
    }
    if (displayUrl === null) {
      return viewerChrome(
        <>
          <PlaceholderIcon aria-hidden>🖼️</PlaceholderIcon>
          <StateText>No display asset is available for this item yet.</StateText>
          <HintText>Check back after processing finishes.</HintText>
        </>,
      );
    }
    return (
      <MediaViewer
        kind={mediaItem.kind}
        mimeType={mimeForViewer}
        displayUrl={displayUrl}
        imageAlt={
          mediaItem.title?.trim() || mediaItem.originalFileName?.trim() || kindLabel(mediaItem.kind)
        }
        onClose={handleClose}
        onNavigate={handleMediaNavigate}
        canNavigatePrevious={canNavigatePrevious}
        canNavigateNext={canNavigateNext}
        escapeConsumedRef={mediaViewerEscapeConsumedRef}
      />
    );
  })();

  useMediaViewerKeyboard({
    enabled: Boolean(mediaId),
    escapeConsumedRef: mediaViewerEscapeConsumedRef,
    onEscape: handleClose,
    onNavigate: handleMediaNavigate,
  });

  const detailsUnchanged = (): boolean => {
    if (mediaItem == null) {
      return true;
    }
    return (
      draftTitle.trim() === (mediaItem.title?.trim() ?? '') &&
      draftDescription.trim() === (mediaItem.description?.trim() ?? '') &&
      draftTakenLocal === toDatetimeLocalValue(mediaItem.takenAt)
    );
  };

  const saveEditDetails = async (): Promise<void> => {
    if (mediaId == null || mediaId === '') {
      return;
    }
    setSaveError(null);
    const takenIso = draftTakenLocal.trim() === '' ? null : fromDatetimeLocalToIso(draftTakenLocal);
    if (draftTakenLocal.trim() !== '' && takenIso == null) {
      setSaveError('Taken date is not valid.');
      return;
    }
    try {
      const result = await updateMediaItemDetails({
        variables: {
          input: {
            mediaItemId: mediaId,
            title: draftTitle.trim() === '' ? undefined : draftTitle.trim(),
            description: draftDescription.trim() === '' ? undefined : draftDescription.trim(),
            takenAt: takenIso ?? undefined,
          },
        },
      });
      const envelope = result.data?.updateMediaItemDetails;
      const contractErrors = envelope?.errors;
      if (contractErrors != null && contractErrors.length > 0) {
        setSaveError(contractErrors[0]?.message ?? 'Could not save changes.');
        return;
      }
      setIsEditingDetails(false);
      await refetch({ mediaItemId: mediaId });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save changes.');
    }
  };

  return (
    <Container>
      <LayoutInner>
        <ViewerColumn>{viewerPane}</ViewerColumn>

        <MetadataPanel>
          <MetadataSection>
            <DetailsPanelHeader>
              <DetailsSectionTitle>Details</DetailsSectionTitle>
              <DetailsPanelCloseButton type="button" onClick={handleClose} aria-label="Close">
                ✕
              </DetailsPanelCloseButton>
            </DetailsPanelHeader>
            <MetadataItem>
              <MetadataLabel>File name</MetadataLabel>
              <MetadataValue>
                {mediaItem != null ? mediaItem.originalFileName?.trim() || '—' : '—'}
              </MetadataValue>
            </MetadataItem>

            {isEditingDetails ? (
              <EditFormCard>
                <FormField>
                  <MetadataLabel htmlFor="media-detail-title">Title</MetadataLabel>
                  <FormTextInput
                    id="media-detail-title"
                    value={draftTitle}
                    onChange={(e) => {
                      setDraftTitle(e.target.value);
                    }}
                    autoComplete="off"
                  />
                </FormField>
                <FormField>
                  <MetadataLabel htmlFor="media-detail-description">Description</MetadataLabel>
                  <FormTextarea
                    id="media-detail-description"
                    rows={4}
                    value={draftDescription}
                    onChange={(e) => {
                      setDraftDescription(e.target.value);
                    }}
                  />
                </FormField>
                <FormField>
                  <MetadataLabel htmlFor="media-detail-taken">Taken</MetadataLabel>
                  <FormDatetime
                    id="media-detail-taken"
                    type="datetime-local"
                    step={60}
                    value={draftTakenLocal}
                    onChange={(e) => {
                      setDraftTakenLocal(e.target.value);
                    }}
                  />
                  <FormHint>Optional. Uses your local timezone.</FormHint>
                </FormField>
                <FormActions>
                  <SecondaryButton type="button" onClick={cancelEditDetails}>
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton
                    type="button"
                    disabled={detailsUnchanged() || saveLoading}
                    onClick={() => {
                      void saveEditDetails();
                    }}
                  >
                    {saveLoading ? 'Saving…' : 'Save'}
                  </PrimaryButton>
                </FormActions>
                {saveError != null ? <FormError role="alert">{saveError}</FormError> : null}
              </EditFormCard>
            ) : (
              <>
                <EditableRowButton type="button" onClick={openEditDetails}>
                  <MetadataLabel>Title</MetadataLabel>
                  <EditableRowValueRow>
                    <EditableValueText $muted={!(mediaItem != null && mediaItem.title?.trim())}>
                      {mediaItem != null && mediaItem.title?.trim()
                        ? mediaItem.title.trim()
                        : 'Not set'}
                    </EditableValueText>
                    <EditCue aria-hidden>✎</EditCue>
                  </EditableRowValueRow>
                </EditableRowButton>
                <EditableRowButton type="button" onClick={openEditDetails}>
                  <MetadataLabel>Description</MetadataLabel>
                  <EditableRowValueRow>
                    <EditableValueText
                      $multiline
                      $muted={!(mediaItem != null && mediaItem.description?.trim())}
                    >
                      {mediaItem != null && mediaItem.description?.trim()
                        ? mediaItem.description.trim()
                        : 'Not set'}
                    </EditableValueText>
                    <EditCue aria-hidden>✎</EditCue>
                  </EditableRowValueRow>
                </EditableRowButton>
                <EditableRowButton type="button" onClick={openEditDetails}>
                  <MetadataLabel>Taken</MetadataLabel>
                  <EditableRowValueRow>
                    <EditableValueText
                      $muted={
                        mediaItem == null ||
                        typeof mediaItem.takenAt !== 'string' ||
                        mediaItem.takenAt.trim() === '' ||
                        !DateTime.fromISO(mediaItem.takenAt).isValid
                      }
                    >
                      {mediaItem != null ? formatTakenDisplay(mediaItem.takenAt) : '—'}
                    </EditableValueText>
                    <EditCue aria-hidden>✎</EditCue>
                  </EditableRowValueRow>
                </EditableRowButton>
              </>
            )}

            <MetadataItem>
              <MetadataLabel>Date added</MetadataLabel>
              <MetadataValue>{formatDateOnly(mediaItem?.createdAt)}</MetadataValue>
            </MetadataItem>
          </MetadataSection>
        </MetadataPanel>
      </LayoutInner>
    </Container>
  );
};

const ViewerShell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(4)};
  overflow: auto;

  @media (max-width: 968px) {
    padding: ${({ theme }) => theme.spacing(2)};
  }
`;

const ViewerCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(8)};
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  max-width: min(960px, 100%);
  width: 100%;
  min-height: 200px;

  @media (max-width: 968px) {
    padding: ${({ theme }) => theme.spacing(2)};
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const PlaceholderIcon = styled.div`
  font-size: 80px;
  opacity: 0.3;
`;

const StateText = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.subtext};
  text-align: center;
`;

const HintText = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.subtext};
  text-align: center;
  opacity: 0.9;
`;

const Container = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.bg};
  display: flex;
  flex-direction: row;
  min-height: 0;
  z-index: 100;

  @media (max-width: 968px) {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    align-items: stretch;
    -webkit-overflow-scrolling: touch;
  }
`;

/** Fills the viewport on small screens and grows with content so the page background stays solid while scrolling. */
const LayoutInner = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  background: ${({ theme }) => theme.colors.bg};

  @media (max-width: 968px) {
    flex-direction: column;
    flex: 1 0 auto;
    min-height: 100dvh;
  }
`;

/** Wraps the viewer so the media + metadata stack and scroll on narrow viewports. */
const ViewerColumn = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 968px) {
    /* Let the image use most of the viewport; details sit below and scroll with the page */
    flex: 1 1 auto;
    min-height: min(52svh, 520px);
    max-height: min(88svh, 920px);
    overflow: hidden;
    width: 100%;
  }
`;

const MetadataPanel = styled.aside`
  width: 320px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.panel};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
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
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.xl};
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
  color: ${({ theme }) => theme.colors.text};
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
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.subtext};
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.panel};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
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
  color: ${({ theme }) => theme.colors.subtext};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetadataValue = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
`;

const EditableRowValueRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
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
  border-radius: ${({ theme }) => theme.radius.sm};
  box-sizing: border-box;
  width: 100%;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  &:hover ${EditableRowValueRow} {
    border-color: ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.bg};
  }
`;

const EditableValueText = styled.div<{ $multiline?: boolean; $muted?: boolean }>`
  font-size: 14px;
  color: ${({ theme, $muted }) => ($muted ? theme.colors.subtext : theme.colors.text)};
  flex: 1;
  text-align: left;
  white-space: ${({ $multiline }) => ($multiline ? 'pre-wrap' : 'normal')};
  font-style: ${({ $muted }) => ($muted ? 'italic' : 'normal')};
`;

const EditCue = styled.span`
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1.4;
  opacity: 0.45;
  color: ${({ theme }) => theme.colors.subtext};
`;

const EditFormCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const formFieldControlCss = css`
  font-size: 14px;
  color: inherit;
  font-family: inherit;
  padding: ${({ theme }) => theme.spacing(1.25)};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.panel};
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const FormTextInput = styled.input`
  ${formFieldControlCss}
`;

const FormTextarea = styled.textarea`
  ${formFieldControlCss}
  resize: vertical;
  min-height: 88px;
`;

const FormDatetime = styled.input`
  ${formFieldControlCss}
`;

const FormHint = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.subtext};
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-top: ${({ theme }) => theme.spacing(0.5)};
`;

const SecondaryButton = styled.button`
  font-size: 13px;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.panel};
  }
`;

const PrimaryButton = styled.button`
  font-size: 13px;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.bg};
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    filter: brightness(1.05);
  }
`;

const FormError = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: ${({ theme }) => theme.spacing(1)};
`;
