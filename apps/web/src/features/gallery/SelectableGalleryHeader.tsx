import styled from 'styled-components';
import { GalleryConfigItems } from '../../hooks/useMultiSelectGallery';
import { SelectableGallerySelectionBar } from './SelectableGallerySelectionBar';
interface SelectableGalleryHeaderProps {
  selectionCount: number;
  clearSelection: () => void;
  Header: React.ComponentType;
  vPaddingUnits?: number;
  hPaddingUnits?: number;
  availableActions: GalleryConfigItems[];
}

export const SelectableGalleryHeader = ({
  selectionCount,
  clearSelection,
  availableActions,
  Header,
  vPaddingUnits = 4,
  hPaddingUnits = 6,
}: SelectableGalleryHeaderProps) => {
  return (
    <HeaderContainer $vPaddingUnits={vPaddingUnits} $hPaddingUnits={hPaddingUnits}>
      {selectionCount > 0 ? (
        <SelectableGallerySelectionBar
          count={selectionCount}
          onClear={clearSelection}
          availableActions={availableActions}
        />
      ) : (
        <Header />
      )}
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div<{ $vPaddingUnits: number; $hPaddingUnits: number }>`
  box-sizing: border-box;
  width: 100%;
  padding: ${({ theme, $vPaddingUnits, $hPaddingUnits }) =>
    `${theme.spacing($vPaddingUnits)} ${theme.spacing($hPaddingUnits)}`};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
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
