import { FrontendUploadStatus } from '@packages/contracts';
import type { ReactElement } from 'react';
import styled from 'styled-components';

import type { UploadItem } from '../../application/UploadMediaItemQueue/mediaUploadTypes';
import { Button } from '../../ui/Primitives';
import { canCancelUpload, canRetryUpload } from './uploadProgressSummary';

type UploadProgressRowProps = {
  item: UploadItem;
  onRetry: () => void;
  onRemove: () => void;
};

export const UploadProgressRow = ({
  item,
  onRetry,
  onRemove,
}: UploadProgressRowProps): ReactElement => {
  const label = item.status.display;
  const errorMessage = item.errors?.[0]?.message;
  const showRetry = canRetryUpload(item.status);
  const showCancel = canCancelUpload(item.status);

  return (
    <Row>
      <RowMain>
        <FileName title={item.file.name}>{item.file.name}</FileName>
        <StatusLine $tone={statusTone(item.status)}>
          <StatusDot $tone={statusTone(item.status)} aria-hidden />
          {label}
        </StatusLine>
        {errorMessage != null && item.status.equals(FrontendUploadStatus.failed) ? (
          <ErrorText>{errorMessage}</ErrorText>
        ) : null}
      </RowMain>
      <RowActions>
        {showRetry ? (
          <Button type="button" variant="ghost" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        {showCancel ? (
          <Button type="button" variant="ghost" size="small" onClick={onRemove}>
            Cancel
          </Button>
        ) : null}
      </RowActions>
    </Row>
  );
};

type StatusTone = 'active' | 'success' | 'error' | 'muted';

const statusTone = (status: UploadItem['status']): StatusTone => {
  if (status.equals(FrontendUploadStatus.failed)) {
    return 'error';
  }
  if (status.equals(FrontendUploadStatus.ready)) {
    return 'success';
  }
  if (
    status.equals(FrontendUploadStatus.queued) ||
    status.equals(FrontendUploadStatus.creating) ||
    status.equals(FrontendUploadStatus.uploading) ||
    status.equals(FrontendUploadStatus.finalizing)
  ) {
    return 'active';
  }
  return 'muted';
};

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1.5)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.border};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
`;

const RowMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.bodyText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusLine = styled.div<{ $tone: StatusTone }>`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme, $tone }) => {
    switch ($tone) {
      case 'error':
        return theme.color.alertErrorText;
      case 'success':
        return theme.color.alertSuccessText;
      case 'active':
        return theme.color.textAccent;
      default:
        return theme.color.bodyTextSecondary;
    }
  }};
`;

const StatusDot = styled.span<{ $tone: StatusTone }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $tone }) => {
    switch ($tone) {
      case 'error':
        return theme.color.alertError;
      case 'success':
        return theme.color.alertSuccess;
      case 'active':
        return theme.color.textAccent;
      default:
        return theme.color.bodyTextMuted;
    }
  }};
`;

const ErrorText = styled.div`
  margin-top: 4px;
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.alertErrorText};
  line-height: 1.35;
`;

const RowActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;
