import { Plus } from 'lucide-react';
import styled from 'styled-components';
import { ShellNavIconButton } from '../shell/ShellNavIconButton';
import { UploadMediaTrigger } from './UploadMediaTrigger';

export const UploadMediaIconButton = () => {
  return (
    <UploadMediaTrigger>
      {({ onPick, isUploading }) => (
        <ShellNavIconButton
          type="button"
          aria-label="Upload media"
          disabled={isUploading}
          onClick={onPick}
        >
          <Plus size={20} strokeWidth={2} aria-hidden />
        </ShellNavIconButton>
      )}
    </UploadMediaTrigger>
  );
};
