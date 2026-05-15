import { useMutation } from '@apollo/client/react';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styled, { createGlobalStyle, css } from 'styled-components';
import { UpdateMediaItemDetailsDocument } from '../../graphql/generated/types';
import type { MediaItemDetailVM } from '../../viewModels/';

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
  const [draftTakenLocal, setDraftTakenLocal] = useState<DateTime | undefined>();
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (mediaItem == null) {
      return;
    }
    setDraftTitle(mediaItem.title?.trim() ?? '');
    setDraftDescription(mediaItem.description?.trim() ?? '');
    setDraftTakenLocal(mediaItem.takenAt);
    setSaveError(undefined);
  }, [mediaItem]);

  const handleCancel = useCallback((): void => {
    setSaveError(undefined);
    onFinishEditing();
  }, [onFinishEditing]);

  const saveEditDetails = useCallback(async (): Promise<void> => {
    setSaveError(undefined);

    try {
      const result = await updateMediaItemDetails({
        variables: {
          input: {
            mediaItemId: mediaItem.id,
            title: draftTitle.trim() === '' ? undefined : draftTitle.trim(),
            description: draftDescription.trim() === '' ? undefined : draftDescription.trim(),
            takenAt: draftTakenLocal,
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
      draftTakenLocal === mediaItem.takenAt
    );
  }, [draftDescription, draftTakenLocal, draftTitle, mediaItem]);

  return (
    <EditFormCard>
      <MediaDetailDatepickerPopperZ />
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
        <DatePickerFieldWrap>
          <DatePicker
            popperClassName="media-detail-form-datepicker-popper"
            customInput={<FormTextInput id="media-detail-taken" autoComplete="off" />}
            selected={draftTakenLocal?.toJSDate()}
            onChange={(date: Date | null) => {
              if (date == null) {
                setDraftTakenLocal(undefined);
                return;
              }
              setDraftTakenLocal(DateTime.fromJSDate(date));
            }}
            showTimeSelect
            timeIntervals={60}
            timeFormat="HH:mm"
            dateFormat="MMM d, yyyy HH:mm"
            isClearable
            placeholderText="Date and time"
          />
        </DatePickerFieldWrap>
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
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EditFormCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  background: ${({ theme }) => theme.color.body};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

/** react-datepicker’s wrapper is inline-block by default, so the field would not match full-width inputs. */
const DatePickerFieldWrap = styled.div`
  width: 100%;

  .react-datepicker-wrapper {
    display: block;
    width: 100%;
  }
`;

const formFieldControlCss = css`
  font-size: 14px;
  color: inherit;
  font-family: inherit;
  padding: ${({ theme }) => theme.spacing(1.25)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.bodyRaised};
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
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

const FormHint = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
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
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.bodyRaised};
  }
`;

const PrimaryButton = styled.button`
  font-size: 13px;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.color.primaryButtonBg};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
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
  color: ${({ theme }) => theme.color.bodyText};
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing(1)};
`;

/** Ensures the floating calendar stacks above {@link MediaItemScreen} (z-index 100). */
const MediaDetailDatepickerPopperZ = createGlobalStyle`
  .media-detail-form-datepicker-popper.react-datepicker-popper {
    z-index: 200;
  }
`;
