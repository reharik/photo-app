import { useState } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../domain/errors/errorTypes';
import { mapSystemError } from '../../domain/errors/mapToError';
import { AppErrorPanel } from '../../ui/AppErrorPanel';

type CreateAlbumModalProps = {
  isCreating: boolean;
  closeCreate: () => void;
  submitCreate: (title: string) => Promise<void>;
};

export const CreateAlbumModal = ({
  isCreating,
  closeCreate,
  submitCreate,
}: CreateAlbumModalProps) => {
  const [newTitle, setNewTitle] = useState('');
  const [appErrors, setAppErrors] = useState<AppError[]>([]);

  const onSubmitCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      setAppErrors([mapSystemError('VALIDATION', 'Enter an album title.', false)]);
      return;
    }
    await submitCreate(newTitle);
  };
  return (
    <ModalBackdrop role="presentation" onClick={() => !isCreating && closeCreate()}>
      <Modal
        role="dialog"
        aria-labelledby="create-album-title"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <AppErrorPanel errors={appErrors} />
        <ModalTitle id="create-album-title">New album</ModalTitle>
        <ModalFieldLabel htmlFor="album-title-input">Title</ModalFieldLabel>
        <ModalTextInput
          id="album-title-input"
          value={newTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
          placeholder="Summer 2026"
          autoFocus
          disabled={isCreating}
        />
        <ModalActions>
          <SecondaryButton type="button" onClick={closeCreate} disabled={isCreating}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onSubmitCreate} disabled={isCreating}>
            {isCreating ? 'Creating…' : 'Create'}
          </PrimaryButton>
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
  background: ${({ theme }) => theme.color.body};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing(4)};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
`;

const ModalTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing(3)};
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
`;

const ModalFieldLabel = styled.label`
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const ModalTextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.bodyRaised};
  color: ${({ theme }) => theme.color.bodyText};
  font-size: 15px;
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
    font-size: 13px;
    font-weight: 600;
  }
`;

const SecondaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  font-weight: 500;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
