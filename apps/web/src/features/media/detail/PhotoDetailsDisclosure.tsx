import { type JSX, useState } from 'react';
import styled from 'styled-components';

export type PhotoDetailsRow = {
  label: string;
  value: string;
};

export type PhotoDetailsDisclosureProps = {
  rows: PhotoDetailsRow[];
  /** When true, disclosure starts open (e.g. sparse rail with no other content). */
  defaultExpanded?: boolean;
};

export const PhotoDetailsDisclosure = ({
  rows,
  defaultExpanded = false,
}: PhotoDetailsDisclosureProps): JSX.Element => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Root>
      <ToggleButton
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <ToggleLabel>Photo details</ToggleLabel>
        <Chevron aria-hidden $expanded={expanded}>
          ›
        </Chevron>
      </ToggleButton>
      {expanded && rows.length > 0 ? (
        <Rows>
          {rows.map((row) => (
            <Row key={row.label}>
              <RowLabel>{row.label}</RowLabel>
              <RowValue>{row.value}</RowValue>
            </Row>
          ))}
        </Rows>
      ) : null}
    </Root>
  );
};

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-top: ${({ theme }) => theme.spacing(1)};
  border-top: 1px solid ${({ theme }) => theme.color.border};
`;

const ToggleButton = styled.button`
  all: unset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing(0.5)} 0;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.fontSize._13};

  &:hover {
    color: ${({ theme }) => theme.color.textSecondary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;

const ToggleLabel = styled.span`
  font-weight: ${({ theme }) => theme.weight.medium};
`;

const Chevron = styled.span<{ $expanded: boolean }>`
  display: inline-block;
  font-size: ${({ theme }) => theme.fontSize._16};
  line-height: 1;
  transform: rotate(${({ $expanded }) => ($expanded ? '90deg' : '0deg')});
  transition: transform 0.15s ease;
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.25)};
`;

const RowLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const RowValue = styled.span`
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.textMuted};
`;
