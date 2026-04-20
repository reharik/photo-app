import styled from 'styled-components';
import { SelectableGallerySelectionBar } from './SelectableGallerySelectionBar';
interface SelectableGalleryHeaderProps {
  selectionCount: number;
  clearSelection: () => void;
  SelectionActions: React.ComponentType;
  Header: React.ComponentType;
}

export const SelectableGalleryHeader = ({
  selectionCount,
  clearSelection,
  Header,
  SelectionActions,
}: SelectableGalleryHeaderProps) => {
  return (
    <HeaderContainer>
      {selectionCount > 0 ? (
        <SelectableGallerySelectionBar
          count={selectionCount}
          onClear={clearSelection}
          SelectionActions={SelectionActions}
        />
      ) : (
        <Header />
      )}
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(6)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 0;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
    align-items: center;
  }
`;
