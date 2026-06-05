import type { ReactNode } from 'react';
import type { AppError } from '../domain/errors/errorTypes';
import { AppErrorPanel } from '../ui/AppErrorPanel';
import { Button } from './Button';
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
          <Button
            type="button"
            variant="secondary"
            size="large"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmTone === 'danger' ? 'danger' : 'primary'}
            size="large"
            loading={isSubmitting}
            onClick={() => {
              void onConfirm();
            }}
          >
            {isSubmitting ? (confirmingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </>
      }
    >
      <AppErrorPanel errors={mutationErrors} />
      {body}
    </AppModal>
  );
};

