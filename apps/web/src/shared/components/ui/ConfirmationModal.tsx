import type { ReactNode } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../../application/errors/types';
import { AppErrorPanel } from '../ui/AppErrorPanel';
import { AppModal } from './AppModal';

type ConfirmationModalProps = {
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: ReactNode;
  body: ReactNode;
  confirmLabel: ReactNode;
  confirmingLabel?: ReactNode;
  cancelLabel?: ReactNode;
  isSubmitting?: boolean;
  mutationErrors?: AppError[];
  confirmTone?: 'default' | 'danger';
  maxWidth?: string;
  titleId?: string;
};

export const ConfirmationModal = ({
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  confirmingLabel,
  cancelLabel = 'Cancel',
  isSubmitting = false,
  mutationErrors = [],
  confirmTone = 'danger',
  maxWidth,
  titleId,
}: ConfirmationModalProps) => {
  return (
    <AppModal
      onClose={onClose}
      title={title}
      titleId={titleId}
      maxWidth={maxWidth}
      closeOnBackdropClick={!isSubmitting}
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </SecondaryButton>
          <ConfirmButton
            type="button"
            $tone={confirmTone}
            onClick={() => {
              void onConfirm();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (confirmingLabel ?? confirmLabel) : confirmLabel}
          </ConfirmButton>
        </>
      }
    >
      <AppErrorPanel errors={mutationErrors} />
      {body}
    </AppModal>
  );
};

const SecondaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
`;

const ConfirmButton = styled.button<{ $tone: 'default' | 'danger' }>`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  border: 1px solid ${({ $tone, theme }) => ($tone === 'danger' ? '#c53030' : theme.colors.accent)};
  background: ${({ $tone, theme }) => ($tone === 'danger' ? '#c53030' : theme.colors.accent)};
  color: white;
`;
