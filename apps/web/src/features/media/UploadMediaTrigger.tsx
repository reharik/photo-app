import { useRef, type ReactNode } from 'react';
import { useUploadQueue } from '../../contexts/UploadQueueContext';
import { type AppError } from '../../domain/errors/errorTypes';

type UploadMediaTriggerProps = {
  albumId?: string;
  setAppErrors?: (errors: AppError[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  children: (args: { onPick: () => void; isUploading: boolean }) => ReactNode;
};

export const UploadMediaTrigger = ({
  albumId,
  setAppErrors,
  multiple = true,
  disabled,
  children,
}: UploadMediaTriggerProps) => {
  const { enqueueFiles, isUploading } = useUploadQueue();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPick = (): void => {
    if (disabled || isUploading) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';

    if (files.length === 0) {
      return;
    }

    setAppErrors?.([]);
    enqueueFiles(files, albumId);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept="image/*,image/heic,image/heif,.heic,.heif"
        data-testid="upload-media-input"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {children({ onPick, isUploading })}
    </>
  );
};
