import styled from 'styled-components';
import { GalleryConfigItems } from '../../hooks/useMultiSelectGallery';

type SelectableGallerySelectionBarProps = {
  count: number;
  onClear: () => void;
  availableActions: GalleryConfigItems[];
};

/**
 * Top bar when one or more grid items are selected (similar to Google Photos).
 */
export const SelectableGallerySelectionBar = ({
  count,
  onClear,
  availableActions,
}: SelectableGallerySelectionBarProps) => {
  const label = count === 1 ? '1 selected' : `${count} selected`;

  return (
    <Bar role="toolbar" aria-label="Selected items">
      <BarLeft>
        <IconButton type="button" onClick={onClear} aria-label="Clear selection">
          ✕
        </IconButton>
        <CountText>{label}</CountText>
      </BarLeft>
      <ActionGroup>
        {availableActions.map((action) => (
          <ToolbarAction key={action.operation.key} type="button" onClick={action.onAction}>
            {action.label}
          </ToolbarAction>
        ))}
      </ActionGroup>
    </Bar>
  );
};

const Bar = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  min-height: 40px;
  flex-wrap: wrap;
`;

const BarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 0;
`;

const CountText = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.bodyRaised};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.color.body};
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const ToolbarAction = styled.button`
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color.primaryButtonBg};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;
