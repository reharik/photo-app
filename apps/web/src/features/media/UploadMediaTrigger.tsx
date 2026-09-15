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
    const input = e.target;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      input.value = '';
      return;
    }

    setAppErrors?.([]);
    enqueueFiles(files, albumId);

    // Reset AFTER handing the files off, never before. WebKit backs a File with a
    // sandbox grant tied to the input element, so clearing `value` while we still
    // need the bytes is a way to lose them. The reset itself has to stay: without
    // it, picking the same file twice in a row fires no change event.
    input.value = '';
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
