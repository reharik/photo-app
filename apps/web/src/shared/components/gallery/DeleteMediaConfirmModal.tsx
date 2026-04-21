import styled from 'styled-components';
import type { AppError } from '../../../application/errors/types';
import { AppErrorPanel } from '../ui/AppErrorPanel';

type DeleteMediaConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  itemCount: number;
  isSubmitting: boolean;
  mutationErrors: AppError[];
  onConfirm: () => Promise<void>;
};

/**
 * Confirmation before permanently deleting media from the library (all albums, storage cleanup TBD via worker).
 */
export const DeleteMediaConfirmModal = ({
  open,
  onClose,
  itemCount,
  isSubmitting,
  mutationErrors,
  onConfirm,
}: DeleteMediaConfirmModalProps) => {
  if (!open) {
    return null;
  }

  const bodyCopy =
    itemCount === 1
      ? 'This item will be removed from your library and from any albums it appears in. This cannot be undone.'
      : `These ${itemCount} items will be removed from your library and from any albums they appear in. This cannot be undone.`;

  return (
    <ModalBackdrop role="presentation" onClick={() => !isSubmitting && onClose()}>
      <Modal
        role="dialog"
        aria-labelledby="delete-media-title"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <AppErrorPanel errors={mutationErrors} />
        <ModalTitle id="delete-media-title">Delete from library?</ModalTitle>
        <ModalBody>{bodyCopy}</ModalBody>
        <ModalActions>
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <DangerButton
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting…' : 'Delete'}
          </DangerButton>
        </ModalActions>
      </Modal>
    </ModalBackdrop>
  );
};

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: ${({ theme }) => theme.spacing(3)};
`;

const Modal = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing(4)};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing(2)};
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const ModalBody = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(3)};
  font-size: 15px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SecondaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const DangerButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: #c53030;
    color: #c53030;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
