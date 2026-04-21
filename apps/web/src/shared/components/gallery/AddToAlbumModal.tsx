import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { mapSystemError } from '../../../application/errors/mapToError';
import type { AppError } from '../../../application/errors/types';
import { AppErrorPanel } from '../ui/AppErrorPanel';

const NEW_ALBUM_VALUE = '__new_album__';

export type AddToAlbumSubmitTarget =
  | { kind: 'existing'; albumId: string }
  | { kind: 'new'; title: string };

type AddToAlbumModalProps = {
  open: boolean;
  onClose: () => void;
  mediaItemCount: number;
  albumOptions: { id: string; title: string }[];
  albumsLoading: boolean;
  isSubmitting: boolean;
  /** Server / mutation errors (in addition to local validation). */
  mutationErrors: AppError[];
  onSubmit: (target: AddToAlbumSubmitTarget) => Promise<void>;
};

export const AddToAlbumModal = ({
  open,
  onClose,
  mediaItemCount,
  albumOptions,
  albumsLoading,
  isSubmitting,
  mutationErrors,
  onSubmit,
}: AddToAlbumModalProps) => {
  const [albumValue, setAlbumValue] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [localErrors, setLocalErrors] = useState<AppError[]>([]);

  const sortedOptions = useMemo(
    () => [...albumOptions].sort((a, b) => a.title.localeCompare(b.title)),
    [albumOptions],
  );

  useEffect(() => {
    if (open) {
      setAlbumValue('');
      setNewTitle('');
      setLocalErrors([]);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const combinedErrors = [...mutationErrors, ...localErrors];

  const handlePrimary = async () => {
    setLocalErrors([]);
    if (albumsLoading) {
      return;
    }
    if (albumValue === '' || albumValue === NEW_ALBUM_VALUE) {
      if (albumValue === NEW_ALBUM_VALUE) {
        const t = newTitle.trim();
        if (!t) {
          setLocalErrors([mapSystemError('VALIDATION', 'Enter a title for the new album.', false)]);
          return;
        }
        await onSubmit({ kind: 'new', title: t });
        return;
      }
      setLocalErrors([mapSystemError('VALIDATION', 'Select an album or create a new one.', false)]);
      return;
    }
    await onSubmit({ kind: 'existing', albumId: albumValue });
  };

  return (
    <ModalBackdrop role="presentation" onClick={() => !isSubmitting && onClose()}>
      <Modal
        role="dialog"
        aria-labelledby="add-to-album-title"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <AppErrorPanel errors={combinedErrors} />
        <ModalTitle id="add-to-album-title">
          Add {mediaItemCount} {mediaItemCount === 1 ? 'item' : 'items'} to an album
        </ModalTitle>
        <ModalFieldLabel htmlFor="add-to-album-select">Album</ModalFieldLabel>
        <SelectRow>
          <ModalSelect
            id="add-to-album-select"
            value={albumValue}
            onChange={(e) => {
              setAlbumValue(e.target.value);
              if (e.target.value !== NEW_ALBUM_VALUE) {
                setNewTitle('');
              }
            }}
            disabled={isSubmitting || albumsLoading}
          >
            <option value="">{albumsLoading ? 'Loading albums…' : 'Choose an album…'}</option>
            {sortedOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
            <option value={NEW_ALBUM_VALUE}>+ New album…</option>
          </ModalSelect>
        </SelectRow>
        {albumValue === NEW_ALBUM_VALUE ? (
          <>
            <ModalFieldLabel htmlFor="add-to-album-new-title">New album title</ModalFieldLabel>
            <ModalTextInput
              id="add-to-album-new-title"
              value={newTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
              placeholder="Summer 2026"
              autoFocus
              disabled={isSubmitting}
            />
          </>
        ) : null}
        <ModalActions>
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => {
              void handlePrimary();
            }}
            disabled={isSubmitting || albumsLoading}
          >
            {isSubmitting ? 'Adding…' : 'Add to album'}
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
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing(4)};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing(3)};
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const ModalFieldLabel = styled.label`
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.subtext};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const SelectRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const ModalSelect = styled.select`
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  cursor: pointer;
`;

const ModalTextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.bg};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
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
