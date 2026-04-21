import styled from 'styled-components';

type SelectableGallerySelectionBarProps = {
  count: number;
  onClear: () => void;
  selectionActions: React.ReactNode;
};

/**
 * Top bar when one or more grid items are selected (similar to Google Photos).
 */
export const SelectableGallerySelectionBar = ({
  count,
  onClear,
  selectionActions,
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
      <ActionGroup>{selectionActions}</ActionGroup>
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
  color: ${({ theme }) => theme.colors.text};

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
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.subtext};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.bg};
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
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
