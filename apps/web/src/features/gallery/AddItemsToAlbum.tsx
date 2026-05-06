import { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../domain/errors/errorTypes';
import { mapSystemError } from '../../domain/errors/mapToError';
import { AppErrorPanel } from '../../ui/AppErrorPanel';
import { Combobox } from '../../ui/Combobox';

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
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [newAlbumTitle, setNewAlbumTitle] = useState<string | null>(null);
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

    if (!selectedAlbumId && !newAlbumTitle) {
      setLocalErrors([mapSystemError('VALIDATION', 'Select an album or create a new one.', false)]);
      return;
    }

    if (newAlbumTitle) {
      const title = newAlbumTitle.trim();
      if (!title) {
        setLocalErrors([mapSystemError('VALIDATION', 'Enter a title for the new album.', false)]);
        return;
      }
      await onSubmit({ kind: 'new', title });
      return;
    }

    const albumId = selectedAlbumId;
    if (!albumId) {
      return;
    }
    await onSubmit({ kind: 'existing', albumId });
  };

  const selectedAlbum =
    selectedAlbumId === null
      ? null
      : (sortedOptions.find((album) => album.id === selectedAlbumId) ?? null);

  return (
    <>
      <AppErrorPanel errors={combinedErrors} />
      <SelectRow>
        <Combobox
          items={sortedOptions}
          value={selectedAlbum}
          onInputValueChange={(value) => {
            const trimmed = value.trim();
            if (!trimmed) {
              setNewAlbumTitle(null);
              return;
            }
            setSelectedAlbumId(null);
            setNewAlbumTitle(trimmed);
          }}
          onChange={(next) => {
            if ('customValue' in next) {
              setSelectedAlbumId(null);
              setNewAlbumTitle(next.customValue);
              return;
            }
            setSelectedAlbumId(next.id);
            setNewAlbumTitle(null);
          }}
          getKey={(album) => album.id}
          getLabel={(album) => album.title}
          allowCustomValue
          customValueLabel={(input) => `Create album: ${input}`}
          label="Album"
          placeholder={albumsLoading ? 'Loading albums…' : 'Choose an album or type a new title…'}
          disabled={isSubmitting || albumsLoading}
        />
      </SelectRow>
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

const SelectRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const AddButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyText};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
