import { useMutation } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { UpdateMediaItemDetailsDocument } from '../graphql/generated/types';
import type { MediaItemDetailVM } from '../viewModels/media/MediaItemDetailVM';
import { fromDatetimeLocalToIso, toDatetimeLocalValue } from './mediaItemMetaFormat';

export type MediaItemDetailFormProps = {
  mediaItem: MediaItemDetailVM;
  onSaved: () => Promise<void>;
  /** Invoked after cancel or successful save so the panel can leave edit mode. */
  onFinishEditing: () => void;
};

export const MediaItemDetailForm = ({
  mediaItem,
  onSaved,
  onFinishEditing,
}: MediaItemDetailFormProps) => {
  const [updateMediaItemDetails, { loading: saveLoading }] = useMutation(
    UpdateMediaItemDetailsDocument,
  );

  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftTakenLocal, setDraftTakenLocal] = useState('');
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (mediaItem == null) {
      return;
    }
    setDraftTitle(mediaItem.title?.trim() ?? '');
    setDraftDescription(mediaItem.description?.trim() ?? '');
    setDraftTakenLocal(toDatetimeLocalValue(mediaItem.takenAt));
    setSaveError(undefined);
  }, [mediaItem]);

  const handleCancel = useCallback((): void => {
    setSaveError(undefined);
    onFinishEditing();
  }, [onFinishEditing]);

  const saveEditDetails = useCallback(async (): Promise<void> => {
    setSaveError(undefined);
    const takenIso =
      draftTakenLocal.trim() === '' ? undefined : fromDatetimeLocalToIso(draftTakenLocal);
    if (draftTakenLocal.trim() !== '' && takenIso == null) {
      setSaveError('Taken date is not valid.');
      return;
    }
    try {
      const result = await updateMediaItemDetails({
        variables: {
          input: {
            mediaItemId: mediaItem.id,
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
      await onSaved();
      onFinishEditing();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save changes.');
    }
  }, [
    draftDescription,
    draftTakenLocal,
    draftTitle,
    onFinishEditing,
    onSaved,
    mediaItem.id,
    updateMediaItemDetails,
  ]);

  const detailsUnchanged = useMemo((): boolean => {
    return (
      draftTitle.trim() === (mediaItem.title?.trim() ?? '') &&
      draftDescription.trim() === (mediaItem.description?.trim() ?? '') &&
      draftTakenLocal === toDatetimeLocalValue(mediaItem.takenAt)
    );
  }, [draftDescription, draftTakenLocal, draftTitle, mediaItem]);

  return (
    <EditFormCard>
      <FormField>
        <DetailMetaLabel htmlFor="media-detail-title">Title</DetailMetaLabel>
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
        <DetailMetaLabel htmlFor="media-detail-description">Description</DetailMetaLabel>
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
        <DetailMetaLabel htmlFor="media-detail-taken">Taken</DetailMetaLabel>
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
        <SecondaryButton type="button" onClick={handleCancel}>
          Cancel
        </SecondaryButton>
        <PrimaryButton
          type="button"
          disabled={detailsUnchanged || saveLoading}
          onClick={saveEditDetails}
        >
          {saveLoading ? 'Saving…' : 'Save'}
        </PrimaryButton>
      </FormActions>
      {saveError != null ? <FormError role="alert">{saveError}</FormError> : undefined}
    </EditFormCard>
  );
};

const DetailMetaLabel = styled.label`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.subtext};
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
