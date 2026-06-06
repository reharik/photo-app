import styled from 'styled-components';
import { Button } from '../../ui/Button';

type MediaPickerSelectionBarProps = {
  count: number;
  onCancel: () => void;
  onAddToAlbum: () => void;
};

export const MediaPickerSelectionBar = ({
  count,
  onCancel,
  onAddToAlbum,
}: MediaPickerSelectionBarProps) => {
  const label = count === 1 ? '1 selected' : `${count} selected`;

  return (
    <Bar role="toolbar" aria-label="Selected items">
      <BarInner>
        <CountText>{label}</CountText>
        <ActionGroup>
          <Button type="button" variant="primary" size="small" onClick={onAddToAlbum}>
            Add to album
          </Button>
          <CancelButton type="button" onClick={onCancel}>
            Cancel
          </CancelButton>
        </ActionGroup>
      </BarInner>
    </Bar>
  );
};

const Bar = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.color.bodyRaised};
  box-shadow: inset 0 -0.5px 0 ${({ theme }) => theme.color.borderSubtle};
`;

const BarInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(1.5)} ${theme.spacing(3)}`};
  min-width: 0;
  box-sizing: border-box;

  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing(1)};
    padding: ${({ theme }) => `${theme.spacing(1.25)} ${theme.spacing(1.5)}`};
  }
`;

const CountText = styled.span`
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.bodyText};
  min-width: 0;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  flex-shrink: 0;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing(0.75)} ${theme.spacing(1)}`};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.color.textMuted};
  font-size: ${({ theme }) => theme.fontSize._13};
  font-weight: ${({ theme }) => theme.weight.medium};
  cursor: pointer;
  transition: color 0.15s ease;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;
