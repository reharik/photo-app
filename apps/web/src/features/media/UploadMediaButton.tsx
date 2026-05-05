import { useApolloClient } from '@apollo/client/react';
import { FrontendUploadStatus } from '@packages/contracts';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { type AppError } from '../../domain/errors/errorTypes';
import { awaitMediaItemsReady } from '../../domain/media/awaitMediaItemsReady';
import { useUploadQueue } from '../../hooks/useUploadQueue';

type UploadMediaButtonProps = {
  setAppErrors?: (errors: AppError[]) => void;
  text?: string;
  shortText?: string;
  onComplete: () => void;
  multiple?: boolean;
};

export const UploadMediaButton = ({
  setAppErrors,
  text,
  shortText,
  multiple = true,
  onComplete,
}: UploadMediaButtonProps) => {
  const client = useApolloClient();
  const { items, enqueueFiles, clearCompleted, isUploading } = useUploadQueue(client);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Supersedes older in-flight backend readiness waits when uploads complete again. */
  const backendWaitGenerationRef = useRef(0);

  const startUploadPick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';

    if (files.length === 0) {
      return;
    }

    setAppErrors?.([]);
    enqueueFiles(files);
  };

  useEffect(() => {
    if (isUploading) {
      return;
    }

    const completedRows = items.filter(
      (item) => item.status === FrontendUploadStatus.complete && item.mediaItemId != null,
    );
    if (completedRows.length === 0) {
      return;
    }

    const ids = [
      ...new Set(
        completedRows.flatMap((item) => (item.mediaItemId != null ? [item.mediaItemId] : [])),
      ),
    ];
    const generation = (backendWaitGenerationRef.current += 1);

    void (async (): Promise<void> => {
      await awaitMediaItemsReady(client, ids);
      if (backendWaitGenerationRef.current !== generation) {
        return;
      }
      void onComplete();
      clearCompleted();
    })();
  }, [items, isUploading, client, onComplete, clearCompleted]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <UploadButton type="button" onClick={startUploadPick} disabled={isUploading}>
        {isUploading ? (
          'Uploading…'
        ) : (
          <>
            <UploadButtonLabelWide>{text || 'Upload Media'}</UploadButtonLabelWide>
            <UploadButtonLabelNarrow>{shortText || 'Upload'}</UploadButtonLabelNarrow>
          </>
        )}
      </UploadButton>
    </>
  );
};

const UploadButtonLabelWide = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

const UploadButtonLabelNarrow = styled.span`
  display: none;

  @media (max-width: 768px) {
    display: inline;
  }
`;

const UploadButton = styled.button`
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
