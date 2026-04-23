import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { mapSystemError } from '../../../application/errors/mapToError';
import type { AppError } from '../../../application/errors/types';
import { AppErrorPanel } from '../ui/AppErrorPanel';

const NEW_ALBUM_VALUE = '__new_album__';

export type AddToAlbumSubmitTarget =
  | { kind: 'existing'; albumId: string }
  | { kind: 'new'; title: string };

type AddItemsToAlbumProps = {
  onClose: () => void;
  albumOptions: { id: string; title: string }[];
  albumsLoading: boolean;
  isSubmitting: boolean;
  /** Server / mutation errors (in addition to local validation). */
  mutationErrors: AppError[];
  onSubmit: (target: AddToAlbumSubmitTarget) => Promise<void>;
};

export const AddItemsToAlbum = ({
  onClose,
  albumOptions,
  albumsLoading,
  isSubmitting,
  mutationErrors,
  onSubmit,
}: AddItemsToAlbumProps) => {
  const [albumValue, setAlbumValue] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [localErrors, setLocalErrors] = useState<AppError[]>([]);

  const sortedOptions = useMemo(
    () => [...albumOptions].sort((a, b) => a.title.localeCompare(b.title)),
    [albumOptions],
  );

  const combinedErrors = [...mutationErrors, ...localErrors];

  const handleAddToAlbum = async () => {
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
    <>
      <AppErrorPanel errors={combinedErrors} />
      <FieldLabel htmlFor="add-to-album-select">Album</FieldLabel>
      <SelectRow>
        <Select
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
        </Select>
      </SelectRow>
      {albumValue === NEW_ALBUM_VALUE ? (
        <>
          <FieldLabel htmlFor="add-to-album-new-title">New album title</FieldLabel>
          <TextInput
            id="add-to-album-new-title"
            value={newTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
            placeholder="Summer 2026"
            autoFocus
            disabled={isSubmitting}
          />
        </>
      ) : null}
      <Actions>
        <CancelButton type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </CancelButton>
        <AddButton
          type="button"
          onClick={() => {
            void handleAddToAlbum();
          }}
          disabled={isSubmitting || albumsLoading}
        >
          {isSubmitting ? 'Adding…' : 'Add to album'}
        </AddButton>
      </Actions>
    </>
  );
};

const FieldLabel = styled.label`
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

const Select = styled.select`
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

const TextInput = styled.input`
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

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const AddButton = styled.button`
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

const CancelButton = styled.button`
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
