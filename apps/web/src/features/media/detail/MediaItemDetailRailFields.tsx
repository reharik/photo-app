import { Pencil } from 'lucide-react';
import { type JSX, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { formatCaptureDateWithWeekday } from '../../../ui/dateDisplay';
import type { MediaItemDetailVM } from '../../../viewModels/';
import { MediaKindRailLabel } from './MediaKindRailLabel';

export type MediaItemDetailRailFieldsProps = {
  mediaItem: MediaItemDetailVM;
  canEdit: boolean;
  isEditingDetails: boolean;
  onOpenEdit: () => void;
  editForm?: ReactNode;
};

export const MediaItemDetailRailFields = ({
  mediaItem,
  canEdit,
  isEditingDetails,
  onOpenEdit,
  editForm,
}: MediaItemDetailRailFieldsProps): JSX.Element => {
  const momentHeading = formatCaptureDateWithWeekday(
    mediaItem.takenAt,
    mediaItem.takenAtUtcOffsetMinutes ?? null,
  );
  const titleText = mediaItem.title?.trim();
  const descriptionText = mediaItem.description?.trim();

  const showMoment =
    momentHeading != null || (canEdit && mediaItem.takenAt?.isValid !== true && !isEditingDetails);
  const showDescription = canEdit || descriptionText != null;

  return (
    <Root>
      {showMoment && !isEditingDetails ? (
        momentHeading != null ? (
          canEdit ? (
            <MomentEditButton type="button" onClick={onOpenEdit}>
              <MomentHeading>{momentHeading}</MomentHeading>
              <EditCue aria-hidden>
                <Pencil size={14} strokeWidth={2} aria-hidden />
              </EditCue>
            </MomentEditButton>
          ) : (
            <MomentHeading>{momentHeading}</MomentHeading>
          )
        ) : canEdit ? (
          <EditablePromptButton type="button" onClick={onOpenEdit}>
            <PromptText>Add date</PromptText>
            <EditCue aria-hidden>
              <Pencil size={14} strokeWidth={2} aria-hidden />
            </EditCue>
          </EditablePromptButton>
        ) : null
      ) : null}

      {isEditingDetails && editForm != null ? editForm : null}

      {!isEditingDetails ? (
        titleText != null ? (
          <EditableFieldButton disabled={!canEdit} type="button" onClick={onOpenEdit}>
            <EditableValueText $multiline>{titleText}</EditableValueText>
            {canEdit ? (
              <EditCue aria-hidden>
                <Pencil size={14} strokeWidth={2} aria-hidden />
              </EditCue>
            ) : null}
          </EditableFieldButton>
        ) : canEdit ? (
          <EditablePromptButton type="button" onClick={onOpenEdit}>
            <PromptText>Add a title</PromptText>
            <EditCue aria-hidden>
              <Pencil size={14} strokeWidth={2} aria-hidden />
            </EditCue>
          </EditablePromptButton>
        ) : (
          <MediaKindRailLabel kind={mediaItem.kind} />
        )
      ) : null}

      {!isEditingDetails && showDescription ? (
        descriptionText != null ? (
          <EditableFieldButton disabled={!canEdit} type="button" onClick={onOpenEdit}>
            <EditableValueText $multiline>{descriptionText}</EditableValueText>
            {canEdit ? (
              <EditCue aria-hidden>
                <Pencil size={14} strokeWidth={2} aria-hidden />
              </EditCue>
            ) : null}
          </EditableFieldButton>
        ) : canEdit ? (
          <EditablePromptButton type="button" onClick={onOpenEdit}>
            <PromptText>Add a description</PromptText>
            <EditCue aria-hidden>
              <Pencil size={14} strokeWidth={2} aria-hidden />
            </EditCue>
          </EditablePromptButton>
        ) : null
      ) : null}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const MomentHeading = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._21};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.textPrimary};
  line-height: 1.3;
  text-align: left;
`;

const MomentEditButton = styled.button`
  all: unset;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  &:hover ${MomentHeading} {
    color: ${({ theme }) => theme.color.textSecondary};
  }
`;

const editableShell = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
`;

const EditableFieldButton = styled.button`
  all: unset;
  display: flex;
  width: 100%;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-sizing: border-box;

  ${editableShell}
  border: 1px dashed ${({ theme }) => theme.color.border};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.body};
  }

  &:disabled {
    cursor: default;
    border: none;
    background: transparent;
    padding-left: 0;
    padding-right: 0;
  }
`;

const EditablePromptButton = styled.button`
  all: unset;
  display: flex;
  width: 100%;
  cursor: pointer;
  box-sizing: border-box;

  ${editableShell}
  border: 1px dashed ${({ theme }) => theme.color.border};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  &:hover {
    border-color: ${({ theme }) => theme.color.border};
    background: ${({ theme }) => theme.color.body};
  }
`;

const EditableValueText = styled.div<{ $multiline?: boolean }>`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.textPrimary};
  flex: 1;
  min-width: 0;
  text-align: left;
  overflow-wrap: break-word;
  white-space: ${({ $multiline }) => ($multiline ? 'pre-wrap' : 'normal')};
`;

const PromptText = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.textMuted};
  flex: 1;
  min-width: 0;
  text-align: left;
  font-style: italic;
`;

const EditCue = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  opacity: 0.45;
  color: ${({ theme }) => theme.color.textMuted};
`;
