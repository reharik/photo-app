import styled from 'styled-components';
import { type AppError } from '../../domain/errors/errorTypes';
import { UploadMediaTrigger } from './UploadMediaTrigger';

type UploadMediaButtonProps = {
  albumId?: string;
  setAppErrors?: (errors: AppError[]) => void;
  text?: string;
  shortText?: string;
  multiple?: boolean;
};

export const UploadMediaButton = ({
  albumId,
  setAppErrors,
  text,
  shortText,
  multiple = true,
}: UploadMediaButtonProps) => {
  return (
    <UploadMediaTrigger albumId={albumId} setAppErrors={setAppErrors} multiple={multiple}>
      {({ onPick, isUploading }) => (
        <UploadButton type="button" onClick={onPick} disabled={isUploading}>
          {isUploading ? (
            'Uploading…'
          ) : (
            <>
              <UploadButtonLabelWide>{text || 'Upload Media'}</UploadButtonLabelWide>
              <UploadButtonLabelNarrow>{shortText || 'Upload'}</UploadButtonLabelNarrow>
            </>
          )}
        </UploadButton>
      )}
    </UploadMediaTrigger>
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
  color: ${({ theme }) => theme.color.primaryButtonText};
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
