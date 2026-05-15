import { DateTime } from 'luxon';
import { JSX } from 'react';
import styled from 'styled-components';

type CommentHeaderDisplay = {
  displayName: string;
  createdAt: DateTime;
  isEdited: boolean;
};

type Props = {
  comment: CommentHeaderDisplay;
};

const formatRelativeTime = (dt: DateTime): string => {
  const now = DateTime.now().get('millisecond');
  const diffMs = now - dt.get('millisecond');
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return dt.toFormat('MMM d, yyyy');
};

export const CommentHeader = ({ comment }: Props): JSX.Element => {
  const { displayName, createdAt, isEdited } = comment;

  return (
    <Root>
      <DisplayName>{displayName}</DisplayName>
      <Timestamp dateTime={createdAt.toLocaleString()} title={createdAt.toLocaleString()}>
        {createdAt ? formatRelativeTime(createdAt) : ''}
      </Timestamp>
      {isEdited ? <EditedBadge>(edited)</EditedBadge> : null}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-wrap: wrap;
  min-width: 0;
`;

const DisplayName = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.semi};
  color: ${({ theme }) => theme.color.bodyText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Timestamp = styled.time`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.textMuted};
  white-space: nowrap;
`;

const EditedBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.textMuted};
  font-style: italic;
  white-space: nowrap;
`;
