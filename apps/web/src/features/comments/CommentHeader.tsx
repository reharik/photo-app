import styled from 'styled-components';

type Props = {
  displayName: string;
  createdAt: Date;
  isEdited: boolean;
};

const formatRelativeTime = (date: Date): string => {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const CommentHeader = ({ displayName, createdAt, isEdited }: Props) => (
  <Root>
    <DisplayName>{displayName}</DisplayName>
    <Timestamp dateTime={createdAt.toISOString()} title={createdAt.toLocaleString()}>
      {formatRelativeTime(createdAt)}
    </Timestamp>
    {isEdited && <EditedBadge>(edited)</EditedBadge>}
  </Root>
);

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
