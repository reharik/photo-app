import styled from 'styled-components';
import { type AppError } from '../../domain/errors/errorTypes';
import { Button } from '../../ui/Button';
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
        <Button
          type="button"
          variant="primary"
          size="large"
          loading={isUploading}
          onClick={onPick}
        >
          <UploadButtonLabelWide>{text || 'Upload Media'}</UploadButtonLabelWide>
          <UploadButtonLabelNarrow>{shortText || 'Upload'}</UploadButtonLabelNarrow>
        </Button>
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

