import { DateTime } from 'luxon';
import { JSX } from 'react';
import styled from 'styled-components';
import { formatActivityTime } from '../../ui/dateDisplay';

type CommentHeaderDisplay = {
  displayName: string;
  createdAt: DateTime;
  isEdited: boolean;
};

type Props = {
  comment: CommentHeaderDisplay;
};

export const CommentHeader = ({ comment }: Props): JSX.Element => {
  const { displayName, createdAt, isEdited } = comment;
  const iso = createdAt.toISO() ?? '';
  const displayTime = createdAt.isValid ? formatActivityTime(createdAt) : '';

  return (
    <Root>
      <DisplayName>{displayName}</DisplayName>
      <Timestamp dateTime={iso} title={displayTime}>
        {displayTime}
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
