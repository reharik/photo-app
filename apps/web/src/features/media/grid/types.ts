export type MultiSelectProps = {
  isSelected: (id: string) => boolean;
  handleModifierClick: (e: React.MouseEvent, id: string, index: number) => void;
  toggleSelectAt: (id: string, index: number) => void;
  enterSelectionAt: (id: string, index: number) => void;
};
